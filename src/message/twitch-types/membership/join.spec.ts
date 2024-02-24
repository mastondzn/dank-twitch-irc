import { assert, describe, it } from "vitest";

import { JoinMessage } from "./join";
import { parseTwitchMessage } from "../../parser/twitch-message";

describe("./message/twitch-types/membership/join", () => {
  describe("joinMessage", () => {
    it("should be able to parse a real JOIN message", () => {
      const message = parseTwitchMessage(
        ":justinfan11111!justinfan11111@justinfan11111.tmi.twitch.tv JOIN #pajlada",
      ) as JoinMessage;

      assert.instanceOf(message, JoinMessage);

      assert.strictEqual(message.channelName, "pajlada");
      assert.strictEqual(message.joinedUsername, "justinfan11111");
    });
  });
});
