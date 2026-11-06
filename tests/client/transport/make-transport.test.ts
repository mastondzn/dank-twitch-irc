import { assert, describe, it, vi } from "vitest";

import type { Transport } from "~/client/transport/transport";
import type {
  ExpandedCustomTransportConfiguration,
  ExpandedWebSocketTransportConfiguration,
} from "~/config/expanded";
import { CustomTransport } from "~/client/transport/custom-transport";
import { makeTransport } from "~/client/transport/make-transport";
import { WebSocketTransport } from "~/client/transport/websocket-transport";

function fakeTransport(): Transport {
  return {
    readable: new ReadableStream<Uint8Array | string>(),
    connect: vi.fn().mockResolvedValue(undefined),
    write: vi.fn(),
    destroy: vi.fn(),
  };
}

describe("./client/transport/make-transport", () => {
  describe("#makeTransport()", () => {
    it("should make a CustomTransport for custom configurations", () => {
      const config: ExpandedCustomTransportConfiguration = {
        type: "custom",
        createTransport: fakeTransport,
        preSetup: false,
      };

      const transport = makeTransport(config);

      assert.instanceOf(transport, CustomTransport);
    });

    it("should make a WebSocketTransport for websocket configurations", () => {
      const config: ExpandedWebSocketTransportConfiguration = {
        type: "websocket",
        url: "wss://irc-ws.chat.twitch.tv",
        preSetup: false,
      };

      const transport = makeTransport(config);

      assert.instanceOf(transport, WebSocketTransport);
    });

    it("should throw an error on unknown transport type", () => {
      // @ts-expect-error override typescript correcting us
      assert.throws(() => makeTransport({ type: "invalid" }), Error);
    });
  });
});
