import { assert, describe, it } from "vitest";

import { WhisperMessage } from "./whisper";
import { TwitchBadgesList } from "../badges";
import { TwitchEmote } from "../emote";
import { parseTwitchMessage } from "../parser/twitch-message";

describe("./message/twitch-types/whisper", () => {
  describe("whisperMessage", () => {
    it("should be able to parse a real WHISPER message correctly", () => {
      const message = parseTwitchMessage(
        "@badges=;color=#2E8B57;display-name=pajbot;emotes=25:7-11;message-id=" +
          "2034;thread-id=40286300_82008718;turbo=0;user-id=82008718;user-type= " +
          ":pajbot!pajbot@pajbot.tmi.twitch.tv WHISPER randers :Riftey Kappa",
      ) as WhisperMessage;

      assert.instanceOf(message, WhisperMessage);

      assert.strictEqual(message.messageText, "Riftey Kappa");

      assert.strictEqual(message.senderUsername, "pajbot");
      assert.strictEqual(message.senderUserID, "82008718");
      assert.strictEqual(message.displayName, "pajbot");

      assert.strictEqual(message.recipientUsername, "randers");

      assert.deepStrictEqual(message.badges, new TwitchBadgesList());
      assert.strictEqual(message.badgesRaw, "");

      assert.deepStrictEqual(message.color, {
        r: 0x2e,
        g: 0x8b,
        b: 0x57,
      });
      assert.strictEqual(message.colorRaw, "#2E8B57");

      assert.deepStrictEqual(message.emotes, [
        new TwitchEmote("25", 7, 12, "Kappa"),
      ]);
      assert.strictEqual(message.emotesRaw, "25:7-11");

      assert.strictEqual(message.messageID, "2034");
      assert.strictEqual(message.threadID, "40286300_82008718");
    });

    it("trims spaces at the end of display names", () => {
      const message = parseTwitchMessage(
        "@badges=;color=#2E8B57;display-name=pajbot\\s;emotes=25:7-11;message-id=" +
          "2034;thread-id=40286300_82008718;turbo=0;user-id=82008718;user-type= " +
          ":pajbot!pajbot@pajbot.tmi.twitch.tv WHISPER randers :Riftey Kappa",
      ) as WhisperMessage;

      assert.strictEqual(message.displayName, "pajbot");
    });
  });
});
