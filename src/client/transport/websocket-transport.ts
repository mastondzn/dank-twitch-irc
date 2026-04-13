import { type Duplex, PassThrough } from "node:stream";

import duplexify from "duplexify";

import type { Transport } from "./transport";
import type { ExpandedWebSocketTransportConfiguration } from "~/config/expanded";

export class WebSocketTransport implements Transport {
  public readonly stream: Duplex;
  private readonly readable: PassThrough;
  private readonly writable: PassThrough;

  private readonly config: ExpandedWebSocketTransportConfiguration;
  private ws: WebSocket | undefined;
  private sendBuffer: string[] = [];
  private opened = false;

  public constructor(config: ExpandedWebSocketTransportConfiguration) {
    this.config = config;

    this.readable = new PassThrough({ decodeStrings: false, objectMode: true });
    this.writable = new PassThrough({ decodeStrings: false, objectMode: true });
    this.stream = duplexify(this.writable, this.readable, {
      decodeStrings: false,
      objectMode: true,
    });
  }

  public connect(connectionListener?: () => void): void {
    this.ws = new WebSocket(this.config.url);

    this.writable.on("data", (data: unknown) => {
      if (this.opened) {
        this.ws?.send(String(data));
      } else {
        this.sendBuffer.push(String(data));
      }
    });

    this.ws.addEventListener("message", (event: MessageEvent) => {
      this.readable.push(event.data);
    });

    this.ws.addEventListener("error", (event: Event) => {
      const error =
        event instanceof ErrorEvent
          ? event.error
          : new Error("WebSocket error");
      this.readable.destroy(error);
    });

    this.ws.addEventListener("close", () => {
      this.readable.push(null);
    });

    this.ws.addEventListener("open", () => {
      this.opened = true;
      for (const data of this.sendBuffer) {
        this.ws?.send(data);
      }
      this.sendBuffer = [];
      connectionListener?.();
    });
  }
}
