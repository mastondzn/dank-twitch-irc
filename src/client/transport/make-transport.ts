import type { Transport } from "./transport";
import type { ExpandedTransportConfiguration } from "~/config/expanded";
import { CustomTransport } from "./custom-transport";
import { WebSocketTransport } from "./websocket-transport";

export function makeTransport(
  config: ExpandedTransportConfiguration,
): Transport {
  switch (config.type) {
    case "custom": {
      return new CustomTransport(config);
    }
    case "websocket": {
      return new WebSocketTransport(config);
    }
    default: {
      throw new Error("Unknown transport type");
    }
  }
}
