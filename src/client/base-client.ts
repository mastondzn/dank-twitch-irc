import EventEmitter from "eventemitter3";

import type { ClientConfiguration } from "~/config/config";
import type { IRCMessage } from "~/message/irc/irc-message";
import {
  type ClientEvents,
  type ClientState,
  CLIENT_STATES,
} from "./interface";
import {
  type ExpandedClientConfiguration,
  expandConfig,
} from "~/config/expanded";

export abstract class BaseClient extends EventEmitter<ClientEvents> {
  public get unconnected(): boolean {
    return this.state === "UNCONNECTED";
  }

  public get connecting(): boolean {
    return this.state === "CONNECTING";
  }

  public get connected(): boolean {
    return this.state === "CONNECTED";
  }

  public get ready(): boolean {
    return this.state === "READY";
  }

  public get closed(): boolean {
    return this.state === "CLOSED";
  }

  public readonly configuration: ExpandedClientConfiguration;
  public abstract readonly wantedChannels: Set<string>;
  public abstract readonly joinedChannels: Set<string>;

  public state: ClientState = "UNCONNECTED";

  protected constructor(partialConfig?: ClientConfiguration) {
    super();
    this.configuration = expandConfig(partialConfig);
  }

  public emitError(error: Error, emitEvenIfClosed = false): void {
    if (this.closed && !emitEvenIfClosed) {
      return;
    }

    this.emit("error", error);
  }

  public emitMessage(message: IRCMessage): void {
    this.emit("message", message);
    this.emit(message.ircCommand, message);
  }

  public emitConnecting(): void {
    if (this.advanceState("CONNECTING")) {
      this.emit("connecting");
    }
  }

  public emitConnected(): void {
    if (this.advanceState("CONNECTED")) {
      this.emit("connect");
    }
  }

  public emitReady(): void {
    if (this.advanceState("READY")) {
      this.emit("ready");
    }
  }

  public emitClosed(error?: Error): void {
    if (this.advanceState("CLOSED")) {
      this.emit("close", error);
    }
  }

  public advanceState(newState: ClientState): boolean {
    if (CLIENT_STATES.indexOf(newState) <= CLIENT_STATES.indexOf(this.state)) {
      return false;
    }

    this.state = newState;
    return true;
  }
}
