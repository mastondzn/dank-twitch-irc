import { DuplexTransport } from "./duplex-transport";
import { TcpTransport } from "./tcp-transport";
import type { Transport } from "./transport";
import { WebSocketTransport } from "./websocket-transport";
import type { ExpandedTransportConfiguration } from "../../config/expanded";

export function makeTransport(
  config: ExpandedTransportConfiguration,
): Transport {
  switch (config.type) {
    case "tcp": {
      return new TcpTransport(config);
    }
    case "duplex": {
      return new DuplexTransport(config);
    }
    case "websocket": {
      return new WebSocketTransport(config);
    }
    default: {
      throw new Error("Unknown transport type");
    }
  }
}
