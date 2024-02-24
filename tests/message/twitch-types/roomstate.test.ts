import { assert, describe, it } from "vitest";

import { parseTwitchMessage } from "~/message/parser/twitch-message";
import {
  RoomstateMessage,
  hasAllStateTags,
} from "~/message/twitch-types/roomstate";

describe("./message/twitch-types/roomstate", () => {
  describe("#hasAllStateTags()", () => {
    it("should return true if all properties are present", () => {
      assert.isTrue(
        hasAllStateTags({
          emoteOnly: true,
          emoteOnlyRaw: "1",

          followersOnlyDuration: -1,
          followersOnlyDurationRaw: "-1",

          r9k: false,
          r9kRaw: "0",

          slowModeDuration: 0,
          slowModeDurationRaw: "0",

          subscribersOnly: false,
          subscribersOnlyRaw: "0",
        }),
      );
    });

    it("should return false if one property is absent", () => {
      assert.isFalse(
        hasAllStateTags({
          followersOnlyDuration: -1,
          followersOnlyDurationRaw: "-1",

          r9k: false,
          r9kRaw: "0",

          slowModeDuration: 0,
          slowModeDurationRaw: "0",

          subscribersOnly: false,
          subscribersOnlyRaw: "0",
        }),
      );
      assert.isFalse(
        hasAllStateTags({
          emoteOnly: true,
          emoteOnlyRaw: "1",

          r9k: false,
          r9kRaw: "0",

          slowModeDuration: 0,
          slowModeDurationRaw: "0",

          subscribersOnly: false,
          subscribersOnlyRaw: "0",
        }),
      );
      assert.isFalse(
        hasAllStateTags({
          emoteOnly: true,
          emoteOnlyRaw: "1",

          followersOnlyDuration: -1,
          followersOnlyDurationRaw: "-1",

          slowModeDuration: 0,
          slowModeDurationRaw: "0",

          subscribersOnly: false,
          subscribersOnlyRaw: "0",
        }),
      );
      assert.isFalse(
        hasAllStateTags({
          emoteOnly: true,
          emoteOnlyRaw: "1",

          followersOnlyDuration: -1,
          followersOnlyDurationRaw: "-1",

          r9k: false,
          r9kRaw: "0",

          subscribersOnly: false,
          subscribersOnlyRaw: "0",
        }),
      );
      assert.isFalse(
        hasAllStateTags({
          emoteOnly: true,
          emoteOnlyRaw: "1",

          followersOnlyDuration: -1,
          followersOnlyDurationRaw: "-1",

          r9k: false,
          r9kRaw: "0",

          slowModeDuration: 0,
          slowModeDurationRaw: "0",
        }),
      );
    });

    it("should return false if only one property is present", () => {
      assert.isFalse(
        hasAllStateTags({
          emoteOnly: true,
          emoteOnlyRaw: "1",
        }),
      );
      assert.isFalse(
        hasAllStateTags({
          followersOnlyDuration: -1,
          followersOnlyDurationRaw: "-1",
        }),
      );
      assert.isFalse(
        hasAllStateTags({
          r9k: false,
          r9kRaw: "0",
        }),
      );
      assert.isFalse(
        hasAllStateTags({
          slowModeDuration: 0,
          slowModeDurationRaw: "0",
        }),
      );
      assert.isFalse(
        hasAllStateTags({
          subscribersOnly: false,
          subscribersOnlyRaw: "0",
        }),
      );
    });
  });

  describe("roomstateMessage", () => {
    it("should be able to parse a fully-populated ROOMSTATE message", () => {
      const messageText =
        "@emote-only=0;followers-only=-1;r9k=0;rituals=0;room-id=40286300;" +
        "slow=0;subs-only=0 :tmi.twitch.tv ROOMSTATE #randers";

      const message = parseTwitchMessage(messageText) as RoomstateMessage;

      assert.instanceOf(message, RoomstateMessage);

      assert.strictEqual(message.channelName, "randers");

      assert.strictEqual(message.channelID, "40286300");

      assert.strictEqual(message.emoteOnly, false);
      assert.strictEqual(message.emoteOnlyRaw, "0");

      assert.strictEqual(message.followersOnlyDuration, -1);
      assert.strictEqual(message.followersOnlyDurationRaw, "-1");

      assert.strictEqual(message.r9k, false);
      assert.strictEqual(message.r9kRaw, "0");

      assert.strictEqual(message.slowModeDuration, 0);
      assert.strictEqual(message.slowModeDurationRaw, "0");

      assert.strictEqual(message.subscribersOnly, false);
      assert.strictEqual(message.subscribersOnlyRaw, "0");

      assert.deepStrictEqual(message.extractRoomState(), {
        emoteOnly: false,
        emoteOnlyRaw: "0",

        followersOnlyDuration: -1,
        followersOnlyDurationRaw: "-1",

        r9k: false,
        r9kRaw: "0",

        slowModeDuration: 0,
        slowModeDurationRaw: "0",

        subscribersOnly: false,
        subscribersOnlyRaw: "0",
      });

      assert.isTrue(hasAllStateTags(message.extractRoomState()));
    });

    it("should be able to parse a single property change ROOMSTATE message", () => {
      const messageText =
        "@emote-only=1;room-id=40286300 :tmi.twitch.tv ROOMSTATE #randers";

      const message = parseTwitchMessage(messageText) as RoomstateMessage;

      assert.instanceOf(message, RoomstateMessage);

      assert.strictEqual(message.channelName, "randers");

      assert.strictEqual(message.channelID, "40286300");

      assert.strictEqual(message.emoteOnly, true);
      assert.strictEqual(message.emoteOnlyRaw, "1");

      assert.isUndefined(message.followersOnlyDuration);
      assert.isUndefined(message.followersOnlyDurationRaw);
      assert.isUndefined(message.r9k);
      assert.isUndefined(message.r9kRaw);
      assert.isUndefined(message.slowModeDuration);
      assert.isUndefined(message.slowModeDurationRaw);
      assert.isUndefined(message.subscribersOnly);
      assert.isUndefined(message.subscribersOnlyRaw);

      assert.deepStrictEqual(message.extractRoomState(), {
        emoteOnly: true,
        emoteOnlyRaw: "1",
      });

      assert.isFalse(hasAllStateTags(message.extractRoomState()));
    });
  });
});
