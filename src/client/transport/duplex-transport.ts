import type { Duplex } from "node:stream";

import type { Transport } from "./transport";
import type { ExpandedDuplexTransportConfiguration } from "~/config/expanded";

export class DuplexTransport implements Transport {
  public readonly stream: Duplex;

  public constructor(config: ExpandedDuplexTransportConfiguration) {
    this.stream = config.stream();
  }

  public connect(connectionListener?: () => void): void {
    if (connectionListener != null) {
      // invoke now (duplex is already connected)
      setImmediate(connectionListener);
    }
  }
}
