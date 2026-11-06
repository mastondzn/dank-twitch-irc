import type { Transport } from "./transport/transport";
import type { ResponseAwaiter } from "~/await/await-response";
import type { ClientConfiguration } from "~/config/config";
import type { ConnectionMixin } from "~/mixins/base-mixin";
import { BaseClient } from "./base-client";
import { ConnectionError, ProtocolError } from "./errors";
import { makeTransport } from "./transport/make-transport";
import { handleReconnectMessage } from "~/functionalities/handle-reconnect-message";
import { replyToServerPing } from "~/functionalities/reply-to-ping";
import { sendClientPings } from "~/functionalities/send-pings";
import { parseTwitchMessage } from "~/message/parser/twitch-message";
import { sendLogin } from "~/operations/login";
import { requestCapabilities } from "~/operations/request-capabilities";
import { anyCauseInstanceof } from "~/utils/any-cause-instanceof";
import { debugLogger } from "~/utils/debug-logger";
import { LineSplitter } from "~/utils/line-splitter";
import { validateIRCCommand } from "~/validation/irc-command";

let connectionIdCounter = 0;

export class SingleConnection extends BaseClient {
  public readonly connectionId = connectionIdCounter++;

  public readonly wantedChannels: Set<string> = new Set<string>();
  public readonly joinedChannels: Set<string> = new Set<string>();

  public readonly pendingResponses: ResponseAwaiter[] = [];
  public readonly transport: Transport;

  protected readonly log = debugLogger(
    `dank-twitch-irc:connection:${this.connectionId}`,
  );

  public constructor(configuration?: ClientConfiguration) {
    super(configuration);

    this.on("error", (error) => {
      if (anyCauseInstanceof(error, ConnectionError)) {
        queueMicrotask(() => {
          this.emitClosed(error);
          this.transport.destroy(error);
        });
      }
    });
    this.on("connect", this.onConnect.bind(this));

    this.transport = makeTransport(this.configuration.connection);

    void this.readIncoming();

    replyToServerPing(this);
    handleReconnectMessage(this);

    this.on("message", (message) => {
      for (const awaiter of this.pendingResponses) {
        const stop = awaiter.onConnectionMessage(message);
        if (stop) {
          break;
        }
      }
    });
  }

  public connect(): void {
    if (!this.unconnected) {
      throw new Error(
        "connect() may only be called on unconnected connections",
      );
    }

    this.emitConnecting();

    if (this.configuration.connection.preSetup) {
      this.once("connect", () => {
        queueMicrotask(() => this.emitReady());
      });
    } else {
      const promises = [
        requestCapabilities(
          this,
          this.configuration.requestMembershipCapability,
        ),
        sendLogin(
          this,
          this.configuration.username,
          this.configuration.password,
        ),
      ];

      void (async () => {
        try {
          await Promise.all(promises);
          this.emitReady();
        } catch {
          // errors during capability/login setup are ignored here
        }
      })();
    }

    void this.transport.connect().then(
      () => this.emitConnected(),
      (error: unknown) => {
        // Surface connection failures through the readable stream so they are
        // handled by readIncoming().
        this.transport.destroy(
          error instanceof Error ? error : new Error(String(error)),
        );
      },
    );
  }

  public close(): void {
    // -> close is emitted
    this.transport.destroy();
  }

  public destroy(error?: Error): void {
    this.transport.destroy(error);
  }

  public sendRaw(command: string): void {
    validateIRCCommand(command);
    this.emit("rawCommmand", command);
    this.log.debug(">", command);
    this.transport.write(`${command}\r\n`);
  }

  public onConnect(): void {
    sendClientPings(this);
  }

  public use(mixin: ConnectionMixin): void {
    mixin.applyToConnection(this);
  }

  private async readIncoming(): Promise<void> {
    const reader = this.transport.readable.getReader();
    const splitter = new LineSplitter();
    const decoder = new TextDecoder();

    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        const chunk =
          typeof value === "string"
            ? value
            : decoder.decode(value, { stream: true });

        for (const line of splitter.push(chunk)) {
          this.handleLine(line);
        }
      }

      const remaining = decoder.decode();
      if (remaining.length > 0) {
        for (const line of splitter.push(remaining)) {
          this.handleLine(line);
        }
      }

      for (const line of splitter.flush()) {
        this.handleLine(line);
      }
    } catch (error) {
      const emittedError = new ConnectionError(
        "Error occurred in transport layer",
        error instanceof Error ? error : new Error(String(error)),
      );
      this.emitError(emittedError);
      this.emitClosed(emittedError);
    } finally {
      reader.releaseLock();
      this.emitClosed();
    }
  }

  private handleLine(line: string): void {
    if (line.length <= 0) {
      // ignore empty lines (allowed in IRC)
      return;
    }

    this.log.debug("<", line);

    let message;
    try {
      message = parseTwitchMessage(line);
    } catch (error) {
      this.emitError(
        new ProtocolError(
          `Error while parsing IRC message from line "${line}"`,
          error as Error,
        ),
      );
      return;
    }
    this.emitMessage(message);
  }
}
