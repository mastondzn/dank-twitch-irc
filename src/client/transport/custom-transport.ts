import type { Transport } from "./transport";
import type { ExpandedCustomTransportConfiguration } from "~/config/expanded";

export class CustomTransport implements Transport {
  public readonly readable: ReadableStream<Uint8Array | string>;

  private readonly inner: Transport;

  public constructor(config: ExpandedCustomTransportConfiguration) {
    this.inner = config.createTransport();
    this.readable = this.inner.readable;
  }

  public connect(connectionListener?: () => void): void {
    this.inner.connect(connectionListener);
  }

  public write(data: string): void {
    this.inner.write(data);
  }

  public destroy(error?: Error): void {
    this.inner.destroy(error);
  }
}
