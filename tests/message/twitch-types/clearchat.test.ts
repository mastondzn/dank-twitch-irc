import { assert, describe, it } from "vitest";

import { ClearchatMessage } from "./clearchat";
import { parseTwitchMessage } from "../parser/twitch-message";

describe("./message/twitch-types/clearchat", () => {
  describe("clearchatMessage", () => {
    it("should be able to parse a real CLEARCHAT timeout message from twitch", () => {
      const messageText =
        "@ban-duration=600;room-id=40286300;target-user-id=70948394;" +
        "tmi-sent-ts=1563051113633 :tmi.twitch.tv CLEARCHAT #randers :weeb123";

      const message: ClearchatMessage = parseTwitchMessage(
        messageText,
      ) as ClearchatMessage;

      assert.instanceOf(message, ClearchatMessage);

      assert.strictEqual(message.channelName, "randers");
      assert.strictEqual(message.targetUsername, "weeb123");
      assert.strictEqual(message.banDuration, 600);
      assert.isFalse(message.wasChatCleared());
      assert.isTrue(message.isTimeout());
      assert.isFalse(message.isPermaban());
    });

    it("should be able to parse a real CLEARCHAT ban message from twitch", () => {
      const messageText =
        "@room-id=40286300;target-user-id=70948394;tmi-sent-ts=1563051758128 " +
        ":tmi.twitch.tv CLEARCHAT #randers :weeb123";

      const message: ClearchatMessage = parseTwitchMessage(
        messageText,
      ) as ClearchatMessage;

      assert.instanceOf(message, ClearchatMessage);

      assert.strictEqual(message.channelName, "randers");
      assert.strictEqual(message.targetUsername, "weeb123");
      assert.isUndefined(message.banDuration);
      assert.isFalse(message.wasChatCleared());
      assert.isFalse(message.isTimeout());
      assert.isTrue(message.isPermaban());
    });

    it("should be able to parse a real CLEARCHAT chat clear message from twitch", () => {
      const messageText =
        "@room-id=40286300;tmi-sent-ts=1563051778390 :tmi.twitch.tv CLEARCHAT #randers";

      const message: ClearchatMessage = parseTwitchMessage(
        messageText,
      ) as ClearchatMessage;

      assert.instanceOf(message, ClearchatMessage);

      assert.strictEqual(message.channelName, "randers");
      assert.isUndefined(message.targetUsername);
      assert.isUndefined(message.banDuration);
      assert.isTrue(message.wasChatCleared());
      assert.isFalse(message.isTimeout());
      assert.isFalse(message.isPermaban());
    });
  });
});
