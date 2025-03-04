import type { SingleConnection } from "~/client/connection";
import type { ClientEvents } from "~/client/interface";
import type { IRCMessage } from "~/message/irc/irc-message";
import { TimeoutError } from "./timeout-error";
import { ConnectionError, MessageError } from "~/client/errors";
import { setDefaults } from "~/utils/set-defaults";

export type Condition = (message: IRCMessage) => boolean;
export type NoResponseAction = "success" | "failure";

export const alwaysFalse: Condition = (): false => false;
export const alwaysTrue: Condition = (): true => true;

export interface AwaitConfig {
  /**
   * If this condition evaluates to true on any incoming message, the promise is resolved with the message
   * that matched.
   */
  success?: Condition;

  /**
   * If this condition evaluates to true on any incoming message, the promise is rejected with an
   * error specifying the cause message.
   */
  failure?: Condition;

  /**
   * If neither the success or failure condition match on any message within
   * this period (after connection, {@link noResponseAction} is taken.
   */
  timeout?: number;

  /**
   * Action to take after
   *   - a timeout occurs or
   *   - a response awaited later than this response is resolved or rejected
   *     (and given that since the server processes commands
   *     and sends their responses strictly sequentially) this response would
   *     never be fulfilled because the server is done processing this command
   *
   *     E.g. the client issues <code>JOIN #a,#b,#c</code> to the server,
   *     and receives the responses for <code>a</code> and <code>c</code>,
   *     in that order. In that case, the response for <code>b</code> can be
   *     rejected the moment the response for <code>c</code> is received.
   */
  noResponseAction?: NoResponseAction;

  /**
   * Function to create custom error type given optional message and
   * cause error.
   *
   * @param message Optional message
   * @param cause Optional cause
   */
  errorType: (message: string, cause?: Error) => Error;

  /**
   * Custom error message to pass to the {@link errorType} function
   * as the message, preferably about what kind of response to what
   * input variables was awaited (e.g. channel name)
   */
  errorMessage: string;
}

const configDefaults = {
  success: alwaysFalse,
  failure: alwaysFalse,
  timeout: 2000,
  noResponseAction: "failure",
};

export class ResponseAwaiter {
  public readonly promise: Promise<IRCMessage | undefined>;

  private readonly unsubscribers: (() => void)[] = [];
  private readonly conn: SingleConnection;
  private readonly config: Required<AwaitConfig>;
  private resolvePromise!: (message: IRCMessage | undefined) => void;
  private rejectPromise!: (reason: Error) => void;

  public constructor(conn: SingleConnection, config: AwaitConfig) {
    this.conn = conn;
    this.config = setDefaults(config, configDefaults);

    this.promise = new Promise((resolve, reject) => {
      this.resolvePromise = resolve;
      this.rejectPromise = reject;
    });

    this.subscribeTo("close", this.onConnectionClosed.bind(this));
    this.joinPendingResponsesQueue();
  }

  /**
   * Called when this response awaiter is inserted to the head of
   * the queue or moves to the queue head after a previous
   * response awaiter was rejected or resolved.
   */
  public movedToQueueHead(): void {
    if (this.conn.connected || this.conn.ready) {
      this.beginTimeout();
    } else {
      const listener = this.beginTimeout.bind(this);
      this.conn.once("connect", listener);
      this.unsubscribers.push(() =>
        this.conn.removeListener("connect", listener),
      );
    }
  }

  /**
   * Called by a later awaiter indicating that this awaiter was still
   * in the queue while the later awaiter matched a response.
   */
  public outpaced(): void {
    this.onNoResponse(
      "A response to a command issued later than this command was received",
    );
  }

  private unsubscribe(): void {
    for (const function_ of this.unsubscribers) function_();
  }

  private resolve(message?: IRCMessage): void {
    this.unsubscribe();
    this.resolvePromise(message);
  }

  private reject(cause: Error): void {
    this.unsubscribe();
    const errorWithCause = this.config.errorType(
      this.config.errorMessage,
      cause,
    );
    process.nextTick(() => this.conn.emitError(errorWithCause, true));
    this.rejectPromise(errorWithCause);
  }

  private onNoResponse(reason: string): void {
    if (this.config.noResponseAction === "failure") {
      this.reject(new TimeoutError(reason));
    } else {
      this.resolve();
    }
  }

  private beginTimeout(): void {
    const registeredTimeout = setTimeout(() => {
      const reason = `Timed out after waiting for response for ${this.config.timeout} milliseconds`;
      this.onNoResponse(reason);
    }, this.config.timeout);

    this.unsubscribers.push(() => {
      clearTimeout(registeredTimeout);
    });
  }

  private joinPendingResponsesQueue(): void {
    const ourIndex = this.conn.pendingResponses.push(this) - 1;
    if (ourIndex === 0) {
      this.movedToQueueHead();
    } // else: we are behind another awaiter
    // which will notify us via #movedToQueueHead() that we should
    // begin the timeout

    this.unsubscribers.push(() => {
      const selfPosition = this.conn.pendingResponses.indexOf(this);

      if (selfPosition === -1) {
        // we are not in the queue anymore (e.g. sliced off by other
        // awaiter)
        return;
      }

      // remove all awaiters, leading up to ourself
      const removedAwaiters = this.conn.pendingResponses.splice(
        0,
        selfPosition + 1,
      );

      // remove ourself
      removedAwaiters.pop();

      // notify the other awaiters they were outpaced
      for (const awaiter of removedAwaiters) awaiter.outpaced();

      // notify the new queue head to begin its timeout
      const newQueueHead = this.conn.pendingResponses[0];
      if (newQueueHead != null) {
        newQueueHead.movedToQueueHead();
      }
    });
  }

  private onConnectionClosed(cause?: Error): void {
    if (cause == null) {
      this.reject(new ConnectionError("Connection closed with no error"));
    } else {
      this.reject(new ConnectionError("Connection closed due to error", cause));
    }
  }

  // returns true if something matched, preventing "later" matchers from
  // running against that message
  public onConnectionMessage(message: IRCMessage): boolean {
    if (this.config.failure(message)) {
      this.reject(
        new MessageError(`Bad response message: ${message.rawSource}`),
      );
      return true;
    } else if (this.config.success(message)) {
      this.resolve(message);
      return true;
    }
    return false;
  }

  private subscribeTo<T extends keyof ClientEvents>(
    eventName: T,
    handler: (...args: ClientEvents[T]) => unknown,
  ): void {
    handler = handler.bind(this);
    this.conn.on(eventName, handler);
    this.unsubscribers.push(() => this.conn.removeListener(eventName, handler));
  }
}

export async function awaitResponse<
  const TNoResponseAction extends NoResponseAction | undefined = undefined,
>(
  conn: SingleConnection,
  config: AwaitConfig & {
    noResponseAction?: TNoResponseAction;
    success?: ((message: IRCMessage) => message is IRCMessage) | Condition;
  },
) {
  return new ResponseAwaiter(conn, config).promise as Promise<
    TNoResponseAction extends "success" ? IRCMessage | undefined : IRCMessage
  >;
}
