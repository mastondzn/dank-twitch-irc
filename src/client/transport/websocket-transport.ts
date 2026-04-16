import { Duplex } from "node:stream";

import type { Transport } from "./transport";
import type { ExpandedWebSocketTransportConfiguration } from "~/config/expanded";

export class WebSocketTransport implements Transport {
  public readonly stream: Duplex;
  private readonly config: ExpandedWebSocketTransportConfiguration;
  private ws: WebSocket | undefined;
  private sendBuffer: string[] = [];
  private opened = false;

  public constructor(config: ExpandedWebSocketTransportConfiguration) {
    this.config = config;

    this.stream = new Duplex({
      decodeStrings: false,
      objectMode: true,
      // eslint-disable-next-line ts/no-empty-function
      read() {},
      write: (chunk, _encoding, callback) => {
        if (this.opened) {
          this.ws?.send(String(chunk));
        } else {
          this.sendBuffer.push(String(chunk));
        }
        callback();
      },
    });
  }

  public connect(connectionListener?: () => void): void {
    this.ws = new WebSocket(this.config.url);
    this.ws.addEventListener("message", (event: MessageEvent) => {
      this.stream.push(event.data);
    });

    this.ws.addEventListener("error", (event: Event) => {
      const error =
        event instanceof ErrorEvent
          ? event.error
          : new Error("WebSocket error");
      this.stream.destroy(error);
    });

    this.ws.addEventListener("close", () => {
      this.stream.push(null);
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
