import { parseTwitchMessage } from "../../parser/twitch-message";
import { JoinMessage } from "./join";
import { describe, it, assert } from "vitest";

describe("./message/twitch-types/membership/join", function () {
  describe("JoinMessage", function () {
    it("should be able to parse a real JOIN message", function () {
      const msg = parseTwitchMessage(
        ":justinfan11111!justinfan11111@justinfan11111.tmi.twitch.tv JOIN #pajlada",
      ) as JoinMessage;

      assert.instanceOf(msg, JoinMessage);

      assert.strictEqual(msg.channelName, "pajlada");
      assert.strictEqual(msg.joinedUsername, "justinfan11111");
    });
  });
});
