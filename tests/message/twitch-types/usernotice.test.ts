/* eslint-disable unicorn/prefer-string-raw */
import { assert, describe, expectTypeOf, it } from "vitest";

import { TwitchBadge } from "~/message";
import { TwitchBadgesList } from "~/message/badges";
import { TwitchEmote } from "~/message/emote";
import { parseTwitchMessage } from "~/message/parser/twitch-message";
import {
  type ResubUsernoticeMessage,
  type SubEventParameters,
  extractEventParameters,
  UsernoticeMessage,
} from "~/message/twitch-types/usernotice";

describe("./message/twitch-types/usernotice", () => {
  describe("#extractEventParams()", () => {
    it("should camelCase all properties that start with msg-param-", () => {
      assert.deepStrictEqual(
        extractEventParameters({
          "msg-param-user-name": "pajlada",
          "msg-id": "abc123efg",
          "msg-parameter-msg-id": "987398274923",
        }),
        {
          username: "pajlada",
        },
      );
    });

    it("should parse integer properties and add a raw- property for them", () => {
      assert.deepStrictEqual(
        extractEventParameters({
          "msg-param-months": "12",
        }),
        {
          months: 12,
          monthsRaw: "12",
        },
      );
    });

    it("should parse boolean properties and add a raw- property for them", () => {
      assert.deepStrictEqual(
        extractEventParameters({
          "msg-param-should-share-streak": "1",
        }),
        {
          shouldShareStreak: true,
          shouldShareStreakRaw: "1",
        },
      );

      assert.deepStrictEqual(
        extractEventParameters({
          "msg-param-should-share-streak": "0",
        }),
        {
          shouldShareStreak: false,
          shouldShareStreakRaw: "0",
        },
      );
    });

    it("should camelCase -id as ID", () => {
      assert.deepStrictEqual(
        extractEventParameters({
          "msg-param-user-id": "1234567",
        }),
        {
          userID: "1234567",
        },
      );
    });
  });

  describe("usernoticeMessage", () => {
    it("should be able to parse a USERNOTICE with no message, only system-msg", () => {
      const messageText =
        "@badge-info=subscriber/5;badges=subscriber/3;color=;display-name=kakarot127;" +
        "emotes=;flags=;id=5dc14bb3-684b-4c04-8fbb-3c870958ac69;login=kakarot127;mod=0;msg-id=resub;" +
        "msg-param-cumulative-months=5;msg-param-months=0;msg-param-should-share-streak=0;" +
        "msg-param-sub-plan-name=Channel\\sSubscription\\s(faker);msg-param-sub-plan=1000;" +
        "room-id=43691;subscriber=1;system-msg=kakarot127\\ssubscribed\\sat\\sTier\\s1.\\sThey'" +
        "ve\\ssubscribed\\sfor\\s5\\smonths!;tmi-sent-ts=1563102742440;user-id=147030570;user-type= " +
        ":tmi.twitch.tv USERNOTICE #faker";

      const message = parseTwitchMessage(messageText) as UsernoticeMessage;

      assert.instanceOf(message, UsernoticeMessage);

      assert.strictEqual(message.channelName, "faker");
      assert.strictEqual(message.channelID, "43691");

      assert.isUndefined(message.messageText);
      assert.strictEqual(
        message.systemMessage,
        "kakarot127 subscribed at Tier 1. They've subscribed " +
          "for 5 months!",
      );
      assert.strictEqual(message.messageTypeID, "resub");

      assert.strictEqual(message.senderUsername, "kakarot127");
      assert.strictEqual(message.senderUserID, "147030570");

      assert.deepStrictEqual(
        message.badgeInfo,
        new TwitchBadgesList(new TwitchBadge("subscriber", "5")),
      );
      assert.strictEqual(message.badgeInfoRaw, "subscriber/5");

      assert.isUndefined(message.bits);
      assert.isUndefined(message.bitsRaw);

      assert.isUndefined(message.color);
      assert.strictEqual(message.colorRaw, "");

      assert.strictEqual(message.displayName, "kakarot127");
      assert.deepStrictEqual(message.emotes, []);
      assert.deepStrictEqual(message.emotesRaw, "");

      assert.strictEqual(message.isMod, false);
      assert.strictEqual(message.isModRaw, "0");

      assert.strictEqual(message.serverTimestamp.getTime(), 1_563_102_742_440);
      assert.strictEqual(message.serverTimestampRaw, "1563102742440");

      assert.deepStrictEqual(message.eventParams, {
        cumulativeMonths: 5,
        cumulativeMonthsRaw: "5",
        months: 0,
        monthsRaw: "0",
        shouldShareStreak: false,
        shouldShareStreakRaw: "0",
        subPlanName: "Channel Subscription (faker)",
        subPlan: "1000",
        subPlanRaw: "1000",
      });

      assert.isTrue(message.isResub());
      assert.isFalse(message.isCheer());

      // typescript test:
      if (message.isResub()) {
        expectTypeOf(message).toMatchTypeOf<ResubUsernoticeMessage>();

        expectTypeOf(message.eventParams).toMatchTypeOf<SubEventParameters>();
        expectTypeOf(
          message.eventParams.cumulativeMonths,
        ).toMatchTypeOf<number>();
        expectTypeOf(
          message.eventParams.cumulativeMonthsRaw,
        ).toMatchTypeOf<string>();
      }
    });

    it("should be able to parse a resub with message", () => {
      const message = parseTwitchMessage(
        "@badge-info=subscriber/15;badges=subscriber/12;color=#00CCBE" +
          ";display-name=5weatyNuts;emotes=1076725:0-10;flags=;id=fda4d92" +
          "4-cde3-421d-8eea-713401194446;login=5weatynutss;mod=0;msg-id=resu" +
          "b;msg-param-cumulative-months=15;msg-param-months=0;msg-param-sh" +
          "ould-share-streak=0;msg-param-sub-plan-name=Channel\\sSubscripti" +
          "on\\s(dafrancsgo);msg-param-sub-plan=Prime;room-id=41314239;subs" +
          "criber=1;system-msg=5weatyNuts\\ssubscribed\\swith\\sTwitch\\sPri" +
          "me.\\sThey've\\ssubscribed\\sfor\\s15\\smonths!;tmi-sent-ts=1565" +
          "699032594;user-id=169613447;user-type= :tmi.twitch.tv USERNOTICE " +
          "#dafran :dafranPrime Clap",
      ) as UsernoticeMessage;

      assert.strictEqual(message.messageText, "dafranPrime Clap");
      assert.deepStrictEqual(message.emotes, [
        new TwitchEmote("1076725", 0, 11, "dafranPrime"),
      ]);
      assert.strictEqual(message.emotesRaw, "1076725:0-10");

      assert(message.isResub());
    });

    it("trims spaces at the end of display names", () => {
      const message = parseTwitchMessage(
        "@badge-info=subscriber/15;badges=subscriber/12;color=#00CCBE" +
          ";display-name=5weatyNuts;emotes=1076725:0-10;flags=;id=fda4d92" +
          "4-cde3-421d-8eea-713401194446;login=5weatynutss;mod=0;msg-id=resu" +
          "b;msg-param-cumulative-months=15;msg-param-months=0;msg-param-sh" +
          "ould-share-streak=0;msg-param-sub-plan-name=Channel\\sSubscripti" +
          "on\\s(dafrancsgo);msg-param-sub-plan=Prime;room-id=41314239;subs" +
          "criber=1;system-msg=5weatyNuts\\ssubscribed\\swith\\sTwitch\\sPri" +
          "me.\\sThey've\\ssubscribed\\sfor\\s15\\smonths!;tmi-sent-ts=1565" +
          "699032594;user-id=169613447;user-type= :tmi.twitch.tv USERNOTICE " +
          "#dafran :dafranPrime Clap",
      ) as UsernoticeMessage;

      assert.strictEqual(message.displayName, "5weatyNuts");
    });

    it("parses subgift params correctly (correct camelcasing)", () => {
      const message = parseTwitchMessage(
        String.raw`@badge-info=;badges=sub-gifter/50;color=;display-name=AdamAtReflectStudios;emotes=;flags=;id=e21409b1-d25d-4a1a-b5cf-ef27d8b7030e;login=adamatreflectstudios;mod=0;msg-id=subgift;msg-param-gift-months=1;msg-param-months=2;msg-param-origin-id=da\s39\sa3\see\s5e\s6b\s4b\s0d\s32\s55\sbf\sef\s95\s60\s18\s90\saf\sd8\s07\s09;msg-param-recipient-display-name=qatarking24xd;msg-param-recipient-id=236653628;msg-param-recipient-user-name=qatarking24xd;msg-param-sender-count=0;msg-param-sub-plan-name=Channel\sSubscription\s(xqcow);msg-param-sub-plan=1000;room-id=71092938;subscriber=0;system-msg=AdamAtReflectStudios\sgifted\sa\sTier\s1\ssub\sto\sqatarking24xd!;tmi-sent-ts=1594583782376;user-id=211711554;user-type= :tmi.twitch.tv USERNOTICE #xqcow`,
      ) as UsernoticeMessage;

      assert.deepStrictEqual(message.eventParams, {
        giftMonths: 1,
        giftMonthsRaw: "1",
        months: 2,
        monthsRaw: "2",
        originID: "da 39 a3 ee 5e 6b 4b 0d 32 55 bf ef 95 60 18 90 af d8 07 09",
        originIDRaw:
          "da 39 a3 ee 5e 6b 4b 0d 32 55 bf ef 95 60 18 90 af d8 07 09",
        recipientDisplayName: "qatarking24xd",
        recipientID: "236653628",
        recipientUsername: "qatarking24xd",
        senderCount: 0,
        senderCountRaw: "0",
        subPlanName: "Channel Subscription (xqcow)",
        subPlan: "1000",
        subPlanRaw: "1000",
      });
    });

    it("should be able to parse a masssubgift with message", () => {
      const message = parseTwitchMessage(
        String.raw`@badge-info=subscriber/12;badges=subscriber/12,premium/1;color=;display-name=realuser;emotes=;flags=;id=99b77ba7-c77f-4d92-ac3a-ad556e921672;login=realuser;mod=0;msg-id=submysterygift;msg-param-mass-gift-count=1;msg-param-origin-id=4e\sd1\s19\sc5\s33\s80\s68\s8c\sdc\sc9\s4d\s96\s73\sd0\sad\s40\s52\sf3\s19\s02;msg-param-sender-count=1;msg-param-sub-plan=1000;room-id=38244999;subscriber=1;system-msg=realuser\sis\sgifting\s1\sTier\s1\sSubs\sto\sbroadcaster's\scommunity!\sThey've\sgifted\sa\stotal\sof\s1\sin\sthe\schannel!;tmi-sent-ts=1633549401426;user-id=239909999;user-type= :tmi.twitch.tv USERNOTICE #broadcaster`,
      ) as UsernoticeMessage;

      assert.strictEqual(message.ircCommand, "USERNOTICE");
      assert.strictEqual(message.ircParameters[0], "#broadcaster");
      assert.strictEqual(message.ircTags["msg-param-mass-gift-count"], "1");
      assert.strictEqual(
        message.systemMessage,
        "realuser is gifting 1 Tier 1 Subs to broadcaster's community! They've gifted a total of 1 in the channel!",
      );
      assert.strictEqual(message.messageTypeID, "submysterygift");

      assert.isTrue(message.isMassSubgift());

      assert.deepStrictEqual(message.eventParams, {
        massGiftCount: 1,
        massGiftCountRaw: "1",
        originID: "4e d1 19 c5 33 80 68 8c dc c9 4d 96 73 d0 ad 40 52 f3 19 02",
        originIDRaw:
          "4e d1 19 c5 33 80 68 8c dc c9 4d 96 73 d0 ad 40 52 f3 19 02",
        senderCount: 1,
        senderCountRaw: "1",
        subPlan: "1000",
        subPlanRaw: "1000",
      });
    });

    it("should be able to parse an announcement usernotice that was sent via IRC", () => {
      const message = parseTwitchMessage(
        "@badge-info=;badges=broadcaster/1,glitchcon2020/1;color=#666666;display-name=NotKarar;emotes=;flags=;id=fb6f330a-b47e-4394-bdae-34c545143a1e;login=notkarar;mod=0;" +
          "msg-id=announcement;room-id=89954186;subscriber=0;system-msg=;tmi-sent-ts=1651337290447;user-id=89954186;user-type= :tmi.twitch.tv USERNOTICE #notkarar :test",
      ) as UsernoticeMessage;

      assert.strictEqual(message.ircCommand, "USERNOTICE");
      assert.strictEqual(message.ircTags["msg-param-color"], undefined);
      assert.strictEqual(message.eventParams.color, undefined);
      assert.strictEqual(message.messageTypeID, "announcement");
    });

    it("should be able to parse an announcement usernotice that was sent via web chat", () => {
      const message = parseTwitchMessage(
        "@badge-info=;badges=broadcaster/1,glitchcon2020/1;color=#666666;display-name=NotKarar;emotes=;flags=;id=e409ccaf-c439-4438-9153-77a056eab544;login=notkarar;mod=0;" +
          "msg-id=announcement;msg-param-color=PRIMARY;room-id=89954186;subscriber=0;system-msg=;tmi-sent-ts=1651337248093;user-id=89954186;user-type= :tmi.twitch.tv USERNOTICE #notkarar :test",
      ) as UsernoticeMessage;

      assert.strictEqual(message.ircCommand, "USERNOTICE");
      assert.strictEqual(message.ircTags["msg-param-color"], "PRIMARY");
      assert.strictEqual(message.messageTypeID, "announcement");
      assert.strictEqual(message.eventParams.color, "PRIMARY");
    });

    it("should be able to parse a viewermilestone without message", () => {
      const message = parseTwitchMessage(
        String.raw`@id=43449cea-71b5-4a73-9b3a-dd57cbad63df;user-type=;system-msg=ManuK10\swatched\s15\sconsecutive\sstreams\sthis\smonth\sand\ssparked\sa\swatch\sstreak!;mod=0;msg-id=viewermilestone;room-id=681333017;badges=;subscriber=0;user-id=422713015;flags=;tmi-sent-ts=1708221929531;emotes=555555584:0-1;login=manuk10;msg-param-copoReward=450;msg-param-value=15;badge-info=;display-name=ManuK10;msg-param-id=1372187b-d93a-4d25-9ef6-c7bbcf68586d;msg-param-category=watch-streak;vip=0;color= :tmi.twitch.tv USERNOTICE #broadcaster`,
      ) as UsernoticeMessage;

      assert.strictEqual(message.ircCommand, "USERNOTICE");
      assert.strictEqual(message.ircParameters[0], "#broadcaster");
      assert.strictEqual(message.ircTags["msg-param-category"], "watch-streak");
      assert.strictEqual(
        message.systemMessage,
        "ManuK10 watched 15 consecutive streams this month and sparked a watch streak!",
      );
      assert.strictEqual(message.messageTypeID, "viewermilestone");
      assert.strictEqual(message.messageText, undefined);
      assert.isTrue(message.isViewerMilestone());

      assert.deepStrictEqual(message.eventParams, {
        id: "1372187b-d93a-4d25-9ef6-c7bbcf68586d",
        copoReward: 450,
        copoRewardRaw: "450",
        value: 15,
        valueRaw: "15",
        category: "watch-streak",
        categoryRaw: "watch-streak",
      });
    });

    it("should be able to parse a viewermilestone with message", () => {
      const message = parseTwitchMessage(
        String.raw`@id=43449cea-71b5-4a73-9b3a-dd57cbad63df;user-type=;system-msg=ManuK10\swatched\s15\sconsecutive\sstreams\sthis\smonth\sand\ssparked\sa\swatch\sstreak!;mod=0;msg-id=viewermilestone;room-id=681333017;badges=;subscriber=0;user-id=422713015;flags=;tmi-sent-ts=1708221929531;emotes=555555584:0-1;login=manuk10;msg-param-copoReward=450;msg-param-value=15;badge-info=;display-name=ManuK10;msg-param-id=1372187b-d93a-4d25-9ef6-c7bbcf68586d;msg-param-category=watch-streak;vip=0;color= :tmi.twitch.tv USERNOTICE #broadcaster <3`,
      ) as UsernoticeMessage;

      assert.strictEqual(message.messageText, "<3");

      assert.strictEqual(message.ircCommand, "USERNOTICE");
      assert.strictEqual(message.ircParameters[0], "#broadcaster");
      assert.strictEqual(message.ircTags["msg-param-category"], "watch-streak");
      assert.strictEqual(
        message.systemMessage,
        "ManuK10 watched 15 consecutive streams this month and sparked a watch streak!",
      );
      assert.strictEqual(message.messageTypeID, "viewermilestone");
      assert.isTrue(message.isViewerMilestone());

      assert.deepStrictEqual(message.eventParams, {
        id: "1372187b-d93a-4d25-9ef6-c7bbcf68586d",
        copoReward: 450,
        copoRewardRaw: "450",
        value: 15,
        valueRaw: "15",
        category: "watch-streak",
        categoryRaw: "watch-streak",
      });
    });

    it("should be able to parse a shared chat session message", () => {
      const messages = [
        parseTwitchMessage(
          String.raw`@badge-info=;badges=;color=#1E90FF;display-name=naronu;emotes=;flags=;id=120537f4-0261-4c25-b52f-fa41683ed47c;login=naronu;mod=0;msg-id=sharedchatnotice;msg-param-cumulative-months=16;msg-param-months=0;msg-param-multimonth-duration=9;msg-param-multimonth-tenure=9;msg-param-should-share-streak=1;msg-param-streak-months=14;msg-param-sub-plan-name=Channel\sSubscription\s(caedrel);msg-param-sub-plan=1000;msg-param-was-gifted=false;room-id=45098797;source-badge-info=subscriber/16;source-badges=subscriber/12;source-id=b119fb84-ecb6-4543-99bb-b797a335083c;source-msg-id=resub;source-room-id=92038375;subscriber=0;system-msg=naronu\ssubscribed\sat\sTier\s1.\sThey've\ssubscribed\sfor\s16\smonths,\scurrently\son\sa\s14\smonth\sstreak!;tmi-sent-ts=1741080304993;user-id=106354170;user-type=;vip=0 :tmi.twitch.tv USERNOTICE #cdawgva`,
        ) as UsernoticeMessage,
        parseTwitchMessage(
          String.raw`@badge-info=subscriber/16;badges=subscriber/12,premium/1;color=#00ECFF;display-name=kxmiixdd;emotes=;flags=;id=676aa8bb-2a81-4348-aee2-c92f57409634;login=kxmiixdd;mod=0;msg-id=resub;msg-param-cumulative-months=16;msg-param-months=0;msg-param-multimonth-duration=1;msg-param-multimonth-tenure=0;msg-param-should-share-streak=0;msg-param-sub-plan-name=Channel\sSubscription\s(caedrel);msg-param-sub-plan=Prime;msg-param-was-gifted=false;room-id=92038375;source-badge-info=subscriber/16;source-badges=subscriber/12,premium/1;source-id=676aa8bb-2a81-4348-aee2-c92f57409634;source-msg-id=resub;source-room-id=92038375;subscriber=1;system-msg=kxmiixdd\ssubscribed\swith\sPrime.\sThey've\ssubscribed\sfor\s16\smonths!;tmi-sent-ts=1741083498145;user-id=193342839;user-type=;vip=0 :tmi.twitch.tv USERNOTICE #caedrel`,
        ) as UsernoticeMessage,
      ];

      for (const message of messages) {
        assert.instanceOf(message, UsernoticeMessage);
        assert.isTrue(message.isResub());
        assert.isTrue(message.isSharedChat());
      }
    });
  });
});
