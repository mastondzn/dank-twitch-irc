import { Duplex } from "node:stream";

import { assert, describe, it } from "vitest";

import { DuplexTransport } from "~/client/transport/duplex-transport";
import { makeTransport } from "~/client/transport/make-transport";
import { TcpTransport } from "~/client/transport/tcp-transport";
import { WebSocketTransport } from "~/client/transport/websocket-transport";
import type {
  ExpandedDuplexTransportConfiguration,
  ExpandedTcpTransportConfiguration,
  ExpandedWebSocketTransportConfiguration,
} from "~/config/expanded";

describe("./client/transport/make-transport", () => {
  describe("#makeTransport()", () => {
    it("should make a TcpTransport for tcp configurations", () => {
      const config: ExpandedTcpTransportConfiguration = {
        type: "tcp",
        secure: true,
        host: "irc.chat.twitch.tv",
        port: 6697,
        preSetup: false,
      };

      const transport = makeTransport(config);

      assert.instanceOf(transport, TcpTransport);
    });

    it("should make a DuplexTransport for duplex configurations", () => {
      const config: ExpandedDuplexTransportConfiguration = {
        type: "duplex",
        stream: () => new Duplex(),
        preSetup: false,
      };

      const transport = makeTransport(config);

      assert.instanceOf(transport, DuplexTransport);
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
