import { assert, describe, it } from "vitest";

import { NoticeMessage } from "./notice";
import { parseTwitchMessage } from "../parser/twitch-message";

describe("./message/twitch-types/notice", () => {
  describe("noticeMessage", () => {
    it("should parse a normal NOTICE sent by the twitch server", () => {
      const messageText =
        "@msg-id=msg_banned :tmi.twitch.tv NOTICE #forsen " +
        ":You are permanently banned from talking in forsen.";

      const message: NoticeMessage = parseTwitchMessage(messageText) as NoticeMessage;

      assert.instanceOf(message, NoticeMessage);

      assert.strictEqual(message.channelName, "forsen");
      assert.strictEqual(
        message.messageText,
        "You are permanently banned from talking in forsen.",
      );
      assert.strictEqual(message.messageID, "msg_banned");
    });

    it("should parse a NOTICE message received before successfuly login", () => {
      const messageText = ":tmi.twitch.tv NOTICE * :Improperly formatted auth";

      const message: NoticeMessage = parseTwitchMessage(messageText) as NoticeMessage;

      assert.instanceOf(message, NoticeMessage);

      assert.isUndefined(message.channelName);
      assert.strictEqual(message.messageText, "Improperly formatted auth");
      assert.isUndefined(message.messageID);
    });
  });
});
