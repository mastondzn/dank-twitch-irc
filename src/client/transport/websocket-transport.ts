import type { Transport } from "./transport";
import type { ExpandedWebSocketTransportConfiguration } from "~/config/expanded";

export class WebSocketTransport implements Transport {
  public readonly readable: ReadableStream<Uint8Array | string>;

  private readonly config: ExpandedWebSocketTransportConfiguration;
  private controller:
    | ReadableStreamDefaultController<Uint8Array | string>
    | undefined;
  private ws: WebSocket | undefined;
  private sendBuffer: string[] = [];
  private connectDeferred: PromiseWithResolvers<undefined> | undefined;
  private opened = false;
  private closed = false;

  public constructor(config: ExpandedWebSocketTransportConfiguration) {
    this.config = config;

    this.readable = new ReadableStream<Uint8Array | string>({
      start: (controller) => {
        this.controller = controller;
      },
      cancel: () => {
        this.destroy();
      },
    });
  }

  public async connect(): Promise<void> {
    if (this.connectDeferred != null) {
      return this.connectDeferred.promise;
    }

    if (this.closed) {
      throw new Error("Transport is closed");
    }

    if (this.ws != null) {
      return;
    }

    const { WebSocket: WebSocketImpl } = globalThis as {
      WebSocket?: typeof WebSocket;
    };

    const deferred = Promise.withResolvers<undefined>();
    this.connectDeferred = deferred;

    if (WebSocketImpl == null) {
      this.fail(
        new Error("WebSocket is not available in the current environment"),
      );
      return deferred.promise;
    }

    let ws: WebSocket;
    try {
      ws = new WebSocketImpl(this.config.url);
    } catch (error) {
      this.fail(error instanceof Error ? error : new Error(String(error)));
      return deferred.promise;
    }

    this.ws = ws;
    ws.binaryType = "arraybuffer";

    ws.addEventListener("message", (event: MessageEvent) => {
      this.enqueue(event.data);
    });

    ws.addEventListener("error", (event: Event) => {
      let error: unknown;
      if (typeof ErrorEvent !== "undefined" && event instanceof ErrorEvent) {
        error = event.error;
      }

      this.fail(error instanceof Error ? error : new Error("WebSocket error"));
    });

    ws.addEventListener("close", () => {
      this.finish();
    });

    ws.addEventListener("open", () => {
      if (this.closed) {
        return;
      }

      this.opened = true;

      const buffered = this.sendBuffer;
      this.sendBuffer = [];

      for (const data of buffered) {
        try {
          ws.send(data);
        } catch (error) {
          this.fail(error instanceof Error ? error : new Error(String(error)));
          return;
        }
      }

      deferred.resolve(undefined);
      this.connectDeferred = undefined;
    });

    return deferred.promise;
  }

  public write(data: string): void {
    if (this.closed) {
      return;
    }

    if (this.opened) {
      try {
        this.ws?.send(data);
      } catch (error) {
        this.fail(error instanceof Error ? error : new Error(String(error)));
      }
      return;
    }

    this.sendBuffer.push(data);
  }

  public destroy(error?: Error): void {
    if (error == null) {
      this.finish();
    } else {
      this.fail(error);
    }

    this.closeSocket();
  }

  private enqueue(data: unknown): void {
    if (this.closed || this.controller == null) {
      return;
    }

    if (typeof data === "string") {
      this.controller.enqueue(data);
    } else if (data instanceof ArrayBuffer) {
      this.controller.enqueue(new Uint8Array(data));
    } else if (ArrayBuffer.isView(data)) {
      this.controller.enqueue(
        new Uint8Array(data.buffer, data.byteOffset, data.byteLength),
      );
    } else {
      this.controller.enqueue(String(data));
    }
  }

  private fail(error: Error): void {
    if (this.closed) {
      return;
    }

    this.closed = true;
    this.controller?.error(error);
    this.sendBuffer = [];
    this.rejectConnect(error);
  }

  private finish(): void {
    if (this.closed) {
      return;
    }

    this.closed = true;
    this.controller?.close();
    this.sendBuffer = [];
    this.rejectConnect(new Error("Transport closed before connecting"));
  }

  private rejectConnect(error: Error): void {
    const deferred = this.connectDeferred;
    this.connectDeferred = undefined;
    deferred?.reject(error);
  }

  private closeSocket(): void {
    const ws = this.ws;
    this.ws = undefined;

    // 0 = CONNECTING, 1 = OPEN
    if (ws != null && (ws.readyState === 0 || ws.readyState === 1)) {
      ws.close();
    }
  }
}
