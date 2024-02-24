import { assert, describe, it } from "vitest";

import { parseTwitchMessage } from "~/message/parser/twitch-message";
import { PartMessage } from "~/message/twitch-types/membership/part";

describe("./message/twitch-types/membership/part", () => {
  describe("partMessage", () => {
    it("should be able to parse a real PART message", () => {
      const message = parseTwitchMessage(
        ":justinfan11111!justinfan11111@justinfan11111.tmi.twitch.tv PART #pajlada",
      ) as PartMessage;

      assert.instanceOf(message, PartMessage);

      assert.strictEqual(message.channelName, "pajlada");
      assert.strictEqual(message.partedUsername, "justinfan11111");
    });
  });
});
