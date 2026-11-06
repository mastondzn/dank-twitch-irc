import type { Transport } from "../client/transport/transport";
import type { CustomTransportConfiguration } from "../config/config";

const DEFAULT_HOST = "irc.chat.twitch.tv";
const DEFAULT_TLS_PORT = 6697;
const DEFAULT_PORT = 6667;

export interface BunTcpTransportOptions {
  /**
   * Whether to use TLS. Defaults to true.
   */
  secure?: boolean;

  /**
   * Host to connect to. Defaults to irc.chat.twitch.tv
   */
  host?: string;

  /**
   * Port to connect to. Defaults to 6697 for TLS and 6667 for plain TCP.
   */
  port?: number;
}

interface BunSocket {
  write: (data: Uint8Array) => number;
  end: () => void;
  close: () => void;
}

interface BunSocketHandlers {
  data?: (socket: BunSocket, data: Uint8Array) => void;
  close?: (socket: BunSocket, error?: Error) => void;
  error?: (socket: BunSocket, error: Error) => void;
  end?: (socket: BunSocket) => void;
  drain?: (socket: BunSocket) => void;
  connectError?: (socket: BunSocket, error: Error) => void;
  timeout?: (socket: BunSocket) => void;
}

interface BunConnectOptions {
  hostname: string;
  port: number;
  tls: boolean;
  socket: BunSocketHandlers;
}

interface BunRuntime {
  connect: (options: BunConnectOptions) => Promise<BunSocket>;
}

function getBun(): BunRuntime {
  const runtime = (globalThis as { Bun?: BunRuntime }).Bun;
  if (runtime == null) {
    throw new Error(
      "createBunTcpTransport requires the Bun runtime (Bun.connect is unavailable)",
    );
  }

  return runtime;
}

/**
 * A TCP/TLS transport that uses Bun's native socket API (`Bun.connect`).
 * Import this from the `@mastondzn/dank-twitch-irc/transports/bun-tcp` subpath.
 */
export class BunTcpTransport implements Transport {
  public readonly readable: ReadableStream<Uint8Array | string>;

  private readonly host: string;
  private readonly port: number;
  private readonly secure: boolean;
  private readonly encoder = new TextEncoder();
  private readonly pending: { bytes: Uint8Array; offset: number }[] = [];

  private controller:
    | ReadableStreamDefaultController<Uint8Array | string>
    | undefined;
  private socket: BunSocket | undefined;
  private connectDeferred: PromiseWithResolvers<undefined> | undefined;
  private opened = false;
  private closed = false;

  public constructor(options: BunTcpTransportOptions = {}) {
    this.secure = options.secure ?? true;
    this.host = options.host ?? DEFAULT_HOST;
    this.port = options.port ?? (this.secure ? DEFAULT_TLS_PORT : DEFAULT_PORT);

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

    if (this.opened) {
      return;
    }

    const deferred = Promise.withResolvers<undefined>();
    this.connectDeferred = deferred;

    try {
      const socket = await getBun().connect({
        hostname: this.host,
        port: this.port,
        tls: this.secure,
        socket: {
          data: (_socket, data) => {
            if (!this.closed) {
              this.controller?.enqueue(data);
            }
          },
          connectError: (_socket, error) => {
            this.fail(error);
          },
          error: (_socket, error) => {
            this.fail(error);
          },
          close: (_socket, error) => {
            if (error == null) {
              this.finish();
            } else {
              this.fail(error);
            }
          },
          end: () => {
            this.finish();
          },
          drain: () => {
            this.flush();
          },
          timeout: () => {
            this.fail(new Error("Connection timed out"));
          },
        },
      });

      if (this.isClosed()) {
        socket.close();
        await deferred.promise;
        return;
      }

      this.socket = socket;
      this.opened = true;
      this.flush();
      deferred.resolve(undefined);
      this.connectDeferred = undefined;
    } catch (error) {
      this.fail(error instanceof Error ? error : new Error(String(error)));
    }

    return deferred.promise;
  }

  public write(data: string): void {
    if (this.closed || data.length === 0) {
      return;
    }

    this.pending.push({ bytes: this.encoder.encode(data), offset: 0 });
    this.flush();
  }

  public destroy(error?: Error): void {
    if (error == null) {
      this.finish();
    } else {
      this.fail(error);
    }

    const socket = this.socket;
    this.socket = undefined;
    socket?.close();
  }

  private flush(): void {
    const socket = this.socket;

    if (!this.opened || this.closed || socket == null) {
      return;
    }

    while (this.pending.length > 0) {
      const chunk = this.pending[0];
      if (chunk == null) {
        return;
      }

      const written = socket.write(chunk.bytes.subarray(chunk.offset));

      if (written < 0) {
        this.finish();
        return;
      }

      if (written === 0) {
        return;
      }

      chunk.offset += written;

      if (chunk.offset < chunk.bytes.byteLength) {
        return;
      }

      this.pending.shift();
    }
  }

  private isClosed(): boolean {
    return this.closed;
  }

  private fail(error: Error): void {
    if (this.closed) {
      return;
    }

    this.closed = true;
    this.opened = false;
    this.pending.length = 0;
    this.controller?.error(error);
    this.rejectConnect(error);
  }

  private finish(): void {
    if (this.closed) {
      return;
    }

    this.closed = true;
    this.opened = false;
    this.pending.length = 0;
    this.controller?.close();
    this.rejectConnect(new Error("Transport closed before connecting"));
  }

  private rejectConnect(error: Error): void {
    const deferred = this.connectDeferred;
    this.connectDeferred = undefined;
    deferred?.reject(error);
  }
}

/**
 * Creates a custom transport configuration that connects using Bun's native
 * TCP/TLS sockets.
 */
export function createBunTcpTransport(
  options: BunTcpTransportOptions = {},
): CustomTransportConfiguration {
  return {
    type: "custom",
    createTransport: () => new BunTcpTransport(options),
  };
}
