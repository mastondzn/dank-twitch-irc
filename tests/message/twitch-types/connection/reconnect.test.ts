import { assert, describe, it } from "vitest";

import { parseTwitchMessage } from "~/message/parser/twitch-message";
import { ReconnectMessage } from "~/message/twitch-types/connection/reconnect";

describe("./message/twitch-types/connection/reconnect", () => {
  describe("reconnectMessage", () => {
    it("should be able to parse a real RECONNECT message", () => {
      const message = parseTwitchMessage(
        ":tmi.twitch.tv RECONNECT",
      ) as ReconnectMessage;

      assert.instanceOf(message, ReconnectMessage);
    });
  });
});
