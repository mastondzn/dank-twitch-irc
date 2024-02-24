import { assert, describe, it } from "vitest";

import { ReconnectMessage } from "./reconnect";
import { parseTwitchMessage } from "../../parser/twitch-message";

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
