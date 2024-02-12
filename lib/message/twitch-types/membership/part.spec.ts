import { assert, describe, it } from "vitest";

import { PartMessage } from "./part";
import { parseTwitchMessage } from "../../parser/twitch-message";

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
