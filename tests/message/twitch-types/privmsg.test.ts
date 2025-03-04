import { assert, describe, it } from "vitest";

import { TwitchBadge } from "~/message/badge";
import { TwitchBadgesList } from "~/message/badges";
import { parseTwitchMessage } from "~/message/parser/twitch-message";
import {
  parseActionAndMessage,
  PrivmsgMessage,
} from "~/message/twitch-types/privmsg";

describe("./message/twitch-types/privmsg", () => {
  describe("#parseActionAndMessage()", () => {
    it("should return non-actions unmodified", () => {
      assert.deepStrictEqual(parseActionAndMessage("HeyGuys"), {
        isAction: false,
        message: "HeyGuys",
      });

      assert.deepStrictEqual(parseActionAndMessage("\u0001ACTION HeyGuys"), {
        isAction: false,
        message: "\u0001ACTION HeyGuys",
      });

      assert.deepStrictEqual(parseActionAndMessage("HeyGuys\u0001"), {
        isAction: false,
        message: "HeyGuys\u0001",
      });

      // missing space
      assert.deepStrictEqual(
        parseActionAndMessage("\u0001ACTIONHeyGuys\u0001"),
        {
          isAction: false,
          message: "\u0001ACTIONHeyGuys\u0001",
        },
      );
    });

    it("should remove action prefix and suffix on valid actions", () => {
      assert.deepStrictEqual(
        parseActionAndMessage("\u0001ACTION HeyGuys\u0001"),
        {
          isAction: true,
          message: "HeyGuys",
        },
      );

      // nested
      assert.deepStrictEqual(
        parseActionAndMessage("\u0001ACTION \u0001ACTION HeyGuys\u0001\u0001"),
        {
          isAction: true,
          message: "\u0001ACTION HeyGuys\u0001",
        },
      );
    });
  });

  describe("privmsgMessage", () => {
    it("should be able to parse a real PRIVMSG message", () => {
      const messageText =
        "@badge-info=subscriber/5;badges=broadcaster/1,subscriber/0;" +
        "color=#19E6E6;display-name=randers;emotes=;flags=;id=7eb848c9-1060-4e5e-9f4c-612877982e79;" +
        "mod=0;room-id=40286300;subscriber=1;tmi-sent-ts=1563096499780;turbo=0;" +
        "user-id=40286300;user-type= :randers!randers@randers.tmi.twitch.tv PRIVMSG #randers :test";

      const message: PrivmsgMessage = parseTwitchMessage(
        messageText,
      ) as PrivmsgMessage;

      assert.instanceOf(message, PrivmsgMessage);

      assert.strictEqual(message.channelName, "randers");

      assert.strictEqual(message.messageText, "test");
      assert.isFalse(message.isAction);

      assert.strictEqual(message.senderUsername, "randers");

      assert.strictEqual(message.senderUserID, "40286300");

      assert.deepStrictEqual(
        message.badgeInfo,
        new TwitchBadgesList(new TwitchBadge("subscriber", "5")),
      );
      assert.strictEqual(message.badgeInfoRaw, "subscriber/5");

      assert.deepStrictEqual(
        message.badges,
        new TwitchBadgesList(
          new TwitchBadge("broadcaster", "1"),
          new TwitchBadge("subscriber", "0"),
        ),
      );
      assert.strictEqual(message.badgesRaw, "broadcaster/1,subscriber/0");

      assert.isUndefined(message.bits);
      assert.isUndefined(message.bitsRaw);

      assert.isUndefined(message.replyParentDisplayName);
      assert.isUndefined(message.replyParentMessageBody);
      assert.isUndefined(message.replyParentMessageID);
      assert.isUndefined(message.replyParentUserID);
      assert.isUndefined(message.replyParentUserLogin);

      assert.deepStrictEqual(message.color, { r: 0x19, g: 0xe6, b: 0xe6 });
      assert.strictEqual(message.colorRaw, "#19E6E6");

      assert.strictEqual(message.displayName, "randers");

      assert.deepStrictEqual(message.emotes, []);
      assert.strictEqual(message.emotesRaw, "");

      assert.strictEqual(
        message.messageID,
        "7eb848c9-1060-4e5e-9f4c-612877982e79",
      );

      assert.isFalse(message.isMod);
      assert.strictEqual(message.isModRaw, "0");

      assert.strictEqual(message.channelID, "40286300");

      assert.strictEqual(message.serverTimestamp.getTime(), 1_563_096_499_780);
      assert.strictEqual(message.serverTimestampRaw, "1563096499780");

      assert.deepStrictEqual(message.extractUserState(), {
        badgeInfo: new TwitchBadgesList(new TwitchBadge("subscriber", "5")),
        badgeInfoRaw: "subscriber/5",
        badges: new TwitchBadgesList(
          new TwitchBadge("broadcaster", "1"),
          new TwitchBadge("subscriber", "0"),
        ),
        badgesRaw: "broadcaster/1,subscriber/0",
        color: { r: 0x19, g: 0xe6, b: 0xe6 },
        colorRaw: "#19E6E6",
        displayName: "randers",
        isMod: false,
        isModRaw: "0",
      });

      assert.isFalse(message.isCheer());
    });

    it("should be able to parse a reply PRIVMSG message", () => {
      const messageText =
        `@badge-info=subscriber/5;badges=broadcaster/1,subscriber/0;` +
        `color=#19E6E6;display-name=randers;emotes=;flags=;id=7eb848c9-1060-4e5e-9f4c-612877982e79;mod=0;${ 
        String.raw`reply-parent-display-name=OtherUser;reply-parent-msg-body=Test:\sAbc;reply-parent-msg-id=abcd;` 
        }reply-parent-user-id=123;reply-parent-user-login=otheruser;room-id=40286300;subscriber=1;tmi-sent-ts=1563096499780;` +
        `turbo=0;user-id=40286300;user-type= :randers!randers@randers.tmi.twitch.tv PRIVMSG #randers :test`;

      const message: PrivmsgMessage = parseTwitchMessage(
        messageText,
      ) as PrivmsgMessage;

      assert.instanceOf(message, PrivmsgMessage);

      assert.isTrue(message.isReply());

      assert.strictEqual(message.replyParentDisplayName, "OtherUser");
      assert.strictEqual(message.replyParentMessageBody, "Test: Abc");
      assert.strictEqual(message.replyParentMessageID, "abcd");
      assert.strictEqual(message.replyParentUserID, "123");
      assert.strictEqual(message.replyParentUserLogin, "otheruser");
    });

    it("trims spaces at the end of display names", () => {
      const messageText =
        `@badge-info=subscriber/5;badges=broadcaster/1,subscriber/0;${ 
        String.raw`color=#19E6E6;display-name=randers\s;emotes=;flags=;id=7eb848c9-1060-4e5e-9f4c-612877982e79;` 
        }mod=0;room-id=40286300;subscriber=1;tmi-sent-ts=1563096499780;turbo=0;` +
        `user-id=40286300;user-type= :randers!randers@randers.tmi.twitch.tv PRIVMSG #randers :test`;

      const message: PrivmsgMessage = parseTwitchMessage(
        messageText,
      ) as PrivmsgMessage;

      assert.strictEqual(message.displayName, "randers");
      assert.strictEqual(message.extractUserState().displayName, "randers");
    });

    it('should be able to parse a reply PRIVMSG message that has the reply message body "foo=bar"', () => {
      const messageText =
        "@badge-info=;badges=;client-nonce=094fcf39e387204709c4cacb85d264e5;color=;display-name=survivedby_bot;emotes=;" +
        "first-msg=0;flags=;id=48dc5388-0dcd-4f56-8772-370397320186;mod=0;reply-parent-display-name=SomeUser;" +
        "reply-parent-msg-body=foo=bar;reply-parent-msg-id=725d8358-d934-42c7-a606-a0b3ed82a642;reply-parent-user-id=441347665;" +
        "reply-parent-user-login=someuser;reply-thread-parent-display-name=SomeUser;reply-thread-parent-msg-id=72" +
        "5d8358-d934-42c7-a606-a0b3ed82a642;reply-thread-parent-user-id=441347665;reply-thread-parent-user-login=someuser;" +
        "returning-chatter=0;room-id=11148817;subscriber=0;tmi-sent-ts=1699992432701;turbo=0;user-id=405330073;" +
        "user-type= :survivedby_bot!survivedby_bot@survivedby_bot.tmi.twitch.tv PRIVMSG #pajlada :@SomeUser -tags";

      const message: PrivmsgMessage = parseTwitchMessage(
        messageText,
      ) as PrivmsgMessage;

      assert.instanceOf(message, PrivmsgMessage);

      assert.isTrue(message.isReply());

      assert.strictEqual(message.replyParentDisplayName, "SomeUser");
      assert.strictEqual(message.replyParentMessageBody, "foo=bar");
      assert.strictEqual(
        message.replyParentMessageID,
        "725d8358-d934-42c7-a606-a0b3ed82a642",
      );
      assert.strictEqual(message.replyParentUserID, "441347665");
      assert.strictEqual(message.replyParentUserLogin, "someuser");
    });
  });
});
