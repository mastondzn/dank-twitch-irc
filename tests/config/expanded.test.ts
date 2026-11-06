import { describe, expect, it } from "vitest";

import { expandConfig, expandTransportConfig } from "~/config/expanded";

describe("./config/expanded", () => {
  describe("#expandConfig()", () => {
    it("should use the Twitch WebSocket endpoint by default", () => {
      expect(expandConfig().connection).toEqual({
        type: "websocket",
        url: "wss://irc-ws.chat.twitch.tv",
        preSetup: false,
      });
    });
  });

  describe("#expandTransportConfig()", () => {
    it("should default a preset WebSocket configuration to the Twitch URL", () => {
      expect(expandTransportConfig({ type: "websocket" })).toEqual({
        type: "websocket",
        url: "wss://irc-ws.chat.twitch.tv",
        preSetup: false,
      });
    });

    it("should keep a custom WebSocket URL", () => {
      expect(
        expandTransportConfig({
          type: "websocket",
          url: "wss://example.com/irc",
        }),
      ).toEqual({
        type: "websocket",
        url: "wss://example.com/irc",
        preSetup: false,
      });
    });

    it("should default preSetup to false for custom transports", () => {
      const createTransport = (): never => {
        throw new Error("not called");
      };

      expect(
        expandTransportConfig({ type: "custom", createTransport }),
      ).toEqual({
        type: "custom",
        createTransport,
        preSetup: false,
      });
    });

    it("should keep preSetup for custom transports", () => {
      const createTransport = (): never => {
        throw new Error("not called");
      };

      expect(
        expandTransportConfig({
          type: "custom",
          createTransport,
          preSetup: true,
        }),
      ).toEqual({
        type: "custom",
        createTransport,
        preSetup: true,
      });
    });
  });
});
