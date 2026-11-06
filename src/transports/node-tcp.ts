import { connect as netConnect, type Socket } from "node:net";
import { connect as tlsConnect, type TLSSocket } from "node:tls";

import type { Transport } from "../client/transport/transport";
import type { CustomTransportConfiguration } from "../config/config";

const DEFAULT_HOST = "irc.chat.twitch.tv";
const DEFAULT_TLS_PORT = 6697;
const DEFAULT_PORT = 6667;

export interface NodeTcpTransportOptions {
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

/**
 * A TCP/TLS transport for Node.js. Import this from the
 * `@mastondzn/dank-twitch-irc/transports/node-tcp` subpath.
 */
export class TcpTransport implements Transport {
  public readonly readable: ReadableStream<Uint8Array | string>;

  private readonly host: string;
  private readonly port: number;
  private readonly secure: boolean;
  private readonly sendBuffer: string[] = [];

  private controller:
    | ReadableStreamDefaultController<Uint8Array | string>
    | undefined;
  private socket: Socket | TLSSocket | undefined;
  private connectDeferred: PromiseWithResolvers<undefined> | undefined;
  private opened = false;
  private closed = false;

  public constructor(options: NodeTcpTransportOptions = {}) {
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

    if (this.socket != null) {
      return;
    }

    const deferred = Promise.withResolvers<undefined>();
    this.connectDeferred = deferred;

    const onConnect = (): void => {
      if (this.closed) {
        return;
      }

      this.opened = true;

      const buffered = this.sendBuffer.splice(0);
      for (const data of buffered) {
        this.socket?.write(data);
      }

      deferred.resolve(undefined);
      this.connectDeferred = undefined;
    };

    try {
      const socket = this.secure
        ? tlsConnect({ host: this.host, port: this.port }, onConnect)
        : netConnect({ host: this.host, port: this.port }, onConnect);

      socket.setNoDelay(true);

      socket.on("data", (chunk: Uint8Array) => {
        if (!this.closed) {
          this.controller?.enqueue(chunk);
        }
      });

      socket.on("error", (error: Error) => {
        this.fail(error);
      });

      socket.on("close", () => {
        this.finish();
      });

      this.socket = socket;
    } catch (error) {
      this.fail(error instanceof Error ? error : new Error(String(error)));
    }

    return deferred.promise;
  }

  public write(data: string): void {
    if (this.closed) {
      return;
    }

    if (this.opened) {
      this.socket?.write(data);
    } else {
      this.sendBuffer.push(data);
    }
  }

  public destroy(error?: Error): void {
    if (error == null) {
      this.finish();
    } else {
      this.fail(error);
    }

    const socket = this.socket;
    this.socket = undefined;
    socket?.destroy(error);
  }

  private fail(error: Error): void {
    if (this.closed) {
      return;
    }

    this.closed = true;
    this.controller?.error(error);
    this.sendBuffer.length = 0;
    this.rejectConnect(error);
  }

  private finish(): void {
    if (this.closed) {
      return;
    }

    this.closed = true;
    this.controller?.close();
    this.sendBuffer.length = 0;
    this.rejectConnect(new Error("Transport closed before connecting"));
  }

  private rejectConnect(error: Error): void {
    const deferred = this.connectDeferred;
    this.connectDeferred = undefined;
    deferred?.reject(error);
  }
}

/**
 * Creates a custom transport configuration that connects using Node's
 * TCP/TLS sockets.
 */
export function createNodeTcpTransport(
  options: NodeTcpTransportOptions = {},
): CustomTransportConfiguration {
  return {
    type: "custom",
    createTransport: () => new TcpTransport(options),
  };
}
