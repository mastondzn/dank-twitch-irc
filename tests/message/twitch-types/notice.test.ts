import { assert, describe, it } from "vitest";

import { parseTwitchMessage } from "~/message/parser/twitch-message";
import { NoticeMessage } from "~/message/twitch-types/notice";

describe("./message/twitch-types/notice", () => {
  describe("noticeMessage", () => {
    it("should parse a normal NOTICE sent by the twitch server", () => {
      const messageText =
        "@msg-id=msg_banned :tmi.twitch.tv NOTICE #forsen " +
        ":You are permanently banned from talking in forsen.";

      const message: NoticeMessage = parseTwitchMessage(
        messageText,
      ) as NoticeMessage;

      assert.instanceOf(message, NoticeMessage);

      assert.strictEqual(message.channel?.login, "forsen");
      assert.strictEqual(
        message.content,
        "You are permanently banned from talking in forsen.",
      );
      assert.strictEqual(message.id, "msg_banned");
    });

    it("should parse a NOTICE message received before successfuly login", () => {
      const messageText = ":tmi.twitch.tv NOTICE * :Improperly formatted auth";

      const message: NoticeMessage = parseTwitchMessage(
        messageText,
      ) as NoticeMessage;

      assert.instanceOf(message, NoticeMessage);

      assert.isUndefined(message.channel?.login);
      assert.strictEqual(message.content, "Improperly formatted auth");
      assert.isUndefined(message.id);
    });
  });
});
