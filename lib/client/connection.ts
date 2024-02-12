import split2 from "split2";

import { BaseClient } from "./base-client";
import { ConnectionError, ProtocolError } from "./errors";
import { makeTransport } from "./transport/make-transport";
import type { Transport } from "./transport/transport";
import type { ResponseAwaiter } from "../await/await-response";
import type { ClientConfiguration } from "../config/config";
import { handleReconnectMessage } from "../functionalities/handle-reconnect-message";
import { replyToServerPing } from "../functionalities/reply-to-ping";
import { sendClientPings } from "../functionalities/send-pings";
import { parseTwitchMessage } from "../message/parser/twitch-message";
import type { ConnectionMixin } from "../mixins/base-mixin";
import { sendLogin } from "../operations/login";
import { requestCapabilities } from "../operations/request-capabilities";
import { anyCauseInstanceof } from "../utils/any-cause-instanceof";
import { debugLogger } from "../utils/debug-logger";
import { ignoreErrors } from "../utils/ignore-errors";
import { validateIRCCommand } from "../validation/irc-command";

let connectionIDCounter = 0;

export class SingleConnection extends BaseClient {
  public readonly connectionID = connectionIDCounter++;

  public readonly wantedChannels: Set<string> = new Set<string>();
  public readonly joinedChannels: Set<string> = new Set<string>();

  public readonly pendingResponses: ResponseAwaiter[] = [];
  public readonly transport: Transport;

  protected readonly log = debugLogger(
    `dank-twitch-irc:connection:${this.connectionID}`,
  );

  public constructor(configuration?: ClientConfiguration) {
    super(configuration);

    this.on("error", (error) => {
      if (anyCauseInstanceof(error, ConnectionError)) {
        process.nextTick(() => {
          this.emitClosed(error);
          this.transport.stream.destroy(error);
        });
      }
    });
    this.on("connect", this.onConnect.bind(this));

    this.transport = makeTransport(this.configuration.connection);

    this.transport.stream.on("close", () => {
      this.emitClosed();
    });
    this.transport.stream.on("error", (error) => {
      const emittedError = new ConnectionError(
        "Error occurred in transport layer",
        error,
      );
      this.emitError(emittedError);
      this.emitClosed(emittedError);
      this.transport.stream.destroy(emittedError);
    });

    this.transport.stream.pipe(split2()).on("data", this.handleLine.bind(this));

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
        process.nextTick(() => this.emitReady());
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

      Promise.all(promises).then(() => this.emitReady(), ignoreErrors);
    }

    this.transport.connect(() => this.emitConnected());
  }

  public close(): void {
    // -> close is emitted
    this.transport.stream.destroy();
  }

  public destroy(error?: Error): void {
    this.transport.stream.destroy(error);
  }

  public sendRaw(command: string): void {
    validateIRCCommand(command);
    this.emit("rawCommmand", command);
    this.log.trace(">", command);
    this.transport.stream.write(`${command}\r\n`);
  }

  public onConnect(): void {
    sendClientPings(this);
  }

  public use(mixin: ConnectionMixin): void {
    mixin.applyToConnection(this);
  }

  private handleLine(line: string): void {
    if (line.length <= 0) {
      // ignore empty lines (allowed in IRC)
      return;
    }

    this.log.trace("<", line);

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
