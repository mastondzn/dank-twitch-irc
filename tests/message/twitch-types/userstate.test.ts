import { assert, describe, it } from "vitest";

import { TwitchBadgesList } from "~/message/badges";
import { parseTwitchMessage } from "~/message/parser/twitch-message";
import { UserstateMessage } from "~/message/twitch-types/userstate";

describe("./message/twitch-types/userstate", () => {
  describe("userstateMessage", () => {
    it("should be able to parse a real userstate message", () => {
      const message = parseTwitchMessage(
        "@badge-info=;badges=;color=#FF0000;" +
          "display-name=zwb3_pyramids;emote-sets=0;mod=0;subscriber=0;user-type=" +
          " :tmi.twitch.tv USERSTATE #randers",
      ) as UserstateMessage;

      assert.instanceOf(message, UserstateMessage);

      assert.strictEqual(message.channelName, "randers");

      assert.deepStrictEqual(message.badgeInfo, new TwitchBadgesList());
      assert.strictEqual(message.badgeInfoRaw, "");

      assert.deepStrictEqual(message.badges, new TwitchBadgesList());
      assert.strictEqual(message.badgesRaw, "");

      assert.deepStrictEqual(message.color, {
        r: 0xff,
        g: 0x00,
        b: 0x00,
      });
      assert.strictEqual(message.colorRaw, "#FF0000");

      assert.strictEqual(message.displayName, "zwb3_pyramids");

      assert.deepStrictEqual(message.emoteSets, ["0"]);
      assert.strictEqual(message.emoteSetsRaw, "0");

      assert.strictEqual(message.isMod, false);
      assert.strictEqual(message.isModRaw, "0");
    });

    it("should extract the correct values with extractUserState()", () => {
      const message = parseTwitchMessage(
        "@badge-info=;badges=;color=#FF0000;" +
          "display-name=zwb3_pyramids;emote-sets=0;mod=0;subscriber=0;user-type=" +
          " :tmi.twitch.tv USERSTATE #randers",
      ) as UserstateMessage;

      assert.deepStrictEqual(message.extractUserState(), {
        badgeInfo: new TwitchBadgesList(),
        badgeInfoRaw: "",
        badges: new TwitchBadgesList(),
        badgesRaw: "",
        color: { r: 0xff, g: 0x00, b: 0x00 },
        colorRaw: "#FF0000",
        displayName: "zwb3_pyramids",
        emoteSets: ["0"],
        emoteSetsRaw: "0",
        isMod: false,
        isModRaw: "0",
      });
    });

    it("trims spaces at the end of display names", () => {
      const message = parseTwitchMessage(
        String.raw`@badge-info=;badges=;color=#FF0000;display-name=zwb3_pyramids\s;emote-sets=0;mod=0;subscriber=0;user-type= :tmi.twitch.tv USERSTATE #randers`,
      ) as UserstateMessage;

      assert.strictEqual(message.displayName, "zwb3_pyramids");
    });
  });
});
