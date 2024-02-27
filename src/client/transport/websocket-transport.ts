import { type Duplex, PassThrough } from "node:stream";

import duplexify from "duplexer3";
import WebSocketDuplex from "simple-websocket";

import type { Transport } from "./transport";
import type { ExpandedWebSocketTransportConfiguration } from "~/config/expanded";

export class WebSocketTransport implements Transport {
  public readonly stream: Duplex;
  private readonly readable: PassThrough;
  private readonly writable: PassThrough;

  private readonly config: ExpandedWebSocketTransportConfiguration;
  private wsStream: WebSocketDuplex | undefined;

  public constructor(config: ExpandedWebSocketTransportConfiguration) {
    this.config = config;

    this.readable = new PassThrough({ decodeStrings: false, objectMode: true });
    this.writable = new PassThrough({ decodeStrings: false, objectMode: true });
    this.stream = duplexify(
      {
        decodeStrings: false,
        objectMode: true,
      },
      this.writable,
      this.readable,
    );
  }

  public connect(connectionListener?: () => void): void {
    this.wsStream = new WebSocketDuplex({
      url: this.config.url,
      decodeStrings: false,
      objectMode: true,
    });
    if (connectionListener != null) {
      this.wsStream.once("connect", connectionListener);
    }

    this.wsStream.pipe(this.readable);
    this.writable.pipe(this.wsStream);
  }
}
