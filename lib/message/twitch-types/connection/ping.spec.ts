import { assert, describe, it } from "vitest";

import { PingMessage } from "./ping";
import { parseTwitchMessage } from "../../parser/twitch-message";

describe("./message/twitch-types/connection/ping", () => {
  describe("pingMessage", () => {
    it("should be able to parse a real PING message with no argument", () => {
      const message = parseTwitchMessage(":tmi.twitch.tv PING") as PingMessage;

      assert.instanceOf(message, PingMessage);

      assert.strictEqual(message.argument, undefined);
    });
    it("should be able to parse a real PING message with argument", () => {
      const message = parseTwitchMessage(
        ":tmi.twitch.tv PING tmi.twitch.tv :argument test",
      ) as PingMessage;

      assert.instanceOf(message, PingMessage);

      assert.strictEqual(message.argument, "argument test");
    });
  });
});
