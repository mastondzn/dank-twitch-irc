import type { Duplex } from "node:stream";

export interface Transport {
  readonly stream: Duplex;
  connect(connectionListener?: () => void): void;
}
