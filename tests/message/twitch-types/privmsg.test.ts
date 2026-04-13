/* eslint-disable unicorn/prefer-string-raw */
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

      assert.strictEqual(message.channel.login, "randers");

      assert.strictEqual(message.content, "test");
      assert.isFalse(message.isAction);

      assert.strictEqual(message.sender.login, "randers");

      assert.strictEqual(message.sender.id, "40286300");

      assert.deepStrictEqual(
        message.sender.badgeInfo,
        new TwitchBadgesList(new TwitchBadge("subscriber", "5")),
      );
      assert.strictEqual(message.sender.badgeInfoRaw, "subscriber/5");

      assert.deepStrictEqual(
        message.sender.badges,
        new TwitchBadgesList(
          new TwitchBadge("broadcaster", "1"),
          new TwitchBadge("subscriber", "0"),
        ),
      );
      assert.strictEqual(
        message.sender.badgesRaw,
        "broadcaster/1,subscriber/0",
      );

      assert.isUndefined(message.bits);
      assert.isUndefined(message.bitsRaw);

      assert.isUndefined(message.replyParent?.displayName);
      assert.isUndefined(message.replyParent?.messageBody);
      assert.isUndefined(message.replyParent?.messageId);
      assert.isUndefined(message.replyParent?.userId);
      assert.isUndefined(message.replyParent?.userLogin);

      assert.deepStrictEqual(message.sender.color, {
        r: 0x19,
        g: 0xe6,
        b: 0xe6,
      });
      assert.strictEqual(message.sender.colorRaw, "#19E6E6");

      assert.strictEqual(message.sender.displayName, "randers");

      assert.deepStrictEqual(message.emotes, []);
      assert.strictEqual(message.emotesRaw, "");

      assert.strictEqual(message.id, "7eb848c9-1060-4e5e-9f4c-612877982e79");

      assert.isFalse(message.sender.isMod);
      assert.strictEqual(message.sender.isModRaw, "0");

      assert.strictEqual(message.channel.id, "40286300");

      assert.strictEqual(message.timestamp.getTime(), 1_563_096_499_780);
      assert.strictEqual(message.timestampRaw, "1563096499780");

      assert.deepStrictEqual(message.sender, {
        login: "randers",
        username: "randers",
        displayName: "randers",
        id: "40286300",
        badgeInfo: new TwitchBadgesList(new TwitchBadge("subscriber", "5")),
        badgeInfoRaw: "subscriber/5",
        badges: new TwitchBadgesList(
          new TwitchBadge("broadcaster", "1"),
          new TwitchBadge("subscriber", "0"),
        ),
        badgesRaw: "broadcaster/1,subscriber/0",
        color: { r: 0x19, g: 0xe6, b: 0xe6 },
        colorRaw: "#19E6E6",
        isMod: false,
        isModRaw: "0",
      });

      assert.isFalse(message.isCheer());
    });

    it("should be able to parse a reply PRIVMSG message", () => {
      const messageText =
        "@badge-info=subscriber/5;badges=broadcaster/1,subscriber/0;" +
        "color=#19E6E6;display-name=randers;emotes=;flags=;id=7eb848c9-1060-4e5e-9f4c-612877982e79;mod=0;" +
        "reply-parent-display-name=OtherUser;reply-parent-msg-body=Test:\\sAbc;reply-parent-msg-id=abcd;" +
        "reply-parent-user-id=123;reply-parent-user-login=otheruser;room-id=40286300;subscriber=1;tmi-sent-ts=1563096499780;" +
        "turbo=0;user-id=40286300;user-type= :randers!randers@randers.tmi.twitch.tv PRIVMSG #randers :test";

      const message: PrivmsgMessage = parseTwitchMessage(
        messageText,
      ) as PrivmsgMessage;

      assert.instanceOf(message, PrivmsgMessage);

      assert.isTrue(message.isReply());

      assert.strictEqual(message.replyParent?.displayName, "OtherUser");
      assert.strictEqual(message.replyParent?.messageBody, "Test: Abc");
      assert.strictEqual(message.replyParent?.messageId, "abcd");
      assert.strictEqual(message.replyParent?.userId, "123");
      assert.strictEqual(message.replyParent?.userLogin, "otheruser");
    });

    it("trims spaces at the end of display names", () => {
      const messageText =
        "@badge-info=subscriber/5;badges=broadcaster/1,subscriber/0;" +
        "color=#19E6E6;display-name=randers\\s;emotes=;flags=;id=7eb848c9-1060-4e5e-9f4c-612877982e79;" +
        "mod=0;room-id=40286300;subscriber=1;tmi-sent-ts=1563096499780;turbo=0;" +
        "user-id=40286300;user-type= :randers!randers@randers.tmi.twitch.tv PRIVMSG #randers :test";

      const message: PrivmsgMessage = parseTwitchMessage(
        messageText,
      ) as PrivmsgMessage;

      assert.strictEqual(message.sender.displayName, "randers");
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

      assert.strictEqual(message.replyParent?.displayName, "SomeUser");
      assert.strictEqual(message.replyParent?.messageBody, "foo=bar");
      assert.strictEqual(
        message.replyParent?.messageId,
        "725d8358-d934-42c7-a606-a0b3ed82a642",
      );
      assert.strictEqual(message.replyParent?.userId, "441347665");
      assert.strictEqual(message.replyParent?.userLogin, "someuser");
    });

    it("should be able to parse shared chat session PRIVMSG messages", () => {
      const messageText =
        "@badge-info=;badges=no_audio/1;client-nonce=f60079ca90dad2c060ca58e16dbc531d;color=#1E90FF;" +
        "display-name=IAmAGeeAm;emotes=;flags=;id=a5517da5-24c9-48ae-aa59-69763c5d8292;mod=0;room-id=45098797;" +
        "source-badge-info=subscriber/10;source-badges=subscriber/9,no_audio/1;" +
        "source-id=b1d05b12-e1ee-4538-bdcf-ccd9a4419d1c;source-room-id=92038375;subscriber=0;" +
        "tmi-sent-ts=1741081026619;turbo=0;user-id=31721778;user-type= " +
        ":iamageeam!iamageeam@iamageeam.tmi.twitch.tv PRIVMSG #cdawgva :HUHH";

      const message: PrivmsgMessage = parseTwitchMessage(
        messageText,
      ) as PrivmsgMessage;

      assert.instanceOf(message, PrivmsgMessage);
      assert.isTrue(message.isSharedChat());

      assert.strictEqual(message.source?.channelId, "92038375");
      assert.strictEqual(message.channel.id, "45098797");
    });

    it("should be able to parse shared chat session PRIVMSG messages that are also replies", () => {
      const messageText =
        "@badge-info=;badges=moderator/1,partner/1;color=#54BC75;display-name=Moobot;emotes=;first-msg=0;" +
        "flags=;id=8afcfd84-703d-489b-88d9-c1bbb2213d9c;mod=1;reply-parent-display-name=ATruthfulLiar18;" +
        "reply-parent-msg-body=!dpmlol;reply-parent-msg-id=be526917-00bd-42fe-98da-1d5ec62a45d4;reply-parent-user-id=140051573;" +
        "reply-parent-user-login=atruthfulliar18;reply-thread-parent-display-name=ATruthfulLiar18;" +
        "reply-thread-parent-msg-id=be526917-00bd-42fe-98da-1d5ec62a45d4;reply-thread-parent-user-id=140051573;" +
        "reply-thread-parent-user-login=atruthfulliar18;returning-chatter=0;room-id=92038375;source-badge-info=;" +
        "source-badges=moderator/1,partner/1;source-id=8afcfd84-703d-489b-88d9-c1bbb2213d9c;source-room-id=92038375;" +
        "subscriber=0;tmi-sent-ts=1741081205072;turbo=0;user-id=1564983;user-type=mod " +
        ":moobot!moobot@moobot.tmi.twitch.tv PRIVMSG #caedrel :foo";

      const message: PrivmsgMessage = parseTwitchMessage(
        messageText,
      ) as PrivmsgMessage;

      assert.instanceOf(message, PrivmsgMessage);
      assert.isTrue(message.isSharedChat());
      assert.isTrue(message.isReply());
      assert.strictEqual(message.replyParent?.displayName, "ATruthfulLiar18");
      assert.strictEqual(message.replyParent?.messageBody, "!dpmlol");
      assert.strictEqual(message.channel.id, "92038375");
      assert.strictEqual(message.source?.channelId, "92038375");
    });
  });
});
