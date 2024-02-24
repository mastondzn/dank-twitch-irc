import { assert, describe, it } from "vitest";

import { parseTwitchMessage } from "~/message/parser/twitch-message";
import { PongMessage } from "~/message/twitch-types/connection/pong";

describe("./message/twitch-types/connection/pong", () => {
  describe("pongMessage", () => {
    it("should be able to parse a real PONG message with no argument", () => {
      const message = parseTwitchMessage(":tmi.twitch.tv PONG") as PongMessage;

      assert.instanceOf(message, PongMessage);

      assert.strictEqual(message.argument, undefined);
    });
    it("should be able to parse a real PONG message with argument", () => {
      const message = parseTwitchMessage(
        ":tmi.twitch.tv PONG tmi.twitch.tv :argument test",
      ) as PongMessage;

      assert.instanceOf(message, PongMessage);

      assert.strictEqual(message.argument, "argument test");
    });
  });
});
