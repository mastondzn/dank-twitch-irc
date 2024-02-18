import { assert, describe, it } from "vitest";

import { GlobaluserstateMessage } from "./globaluserstate";
import { TwitchBadge } from "../badge";
import { TwitchBadgesList } from "../badges";
import { parseTwitchMessage } from "../parser/twitch-message";

describe("./message/twitch-types/globaluserstate", () => {
  describe("globaluserstateMessage", () => {
    it("should be able to parse a real extensive GLOBALUSERSTATE message from twitch", () => {
      const messageText =
        "@badge-info=;badges=bits-charity/1;color=#19E6E6;display-name=RANDERS;" +
        "emote-sets=0,42,237,1564,1627,1937,2344,2470,4236,14417,15961,19194,198648,241281," +
        "445556,520063,771848,905510,1056965,1537462,1598955,1641460,1641461,1641462,300206295;" +
        "user-id=40286300;user-type= :tmi.twitch.tv GLOBALUSERSTATE";

      const message: GlobaluserstateMessage = parseTwitchMessage(
        messageText,
      ) as GlobaluserstateMessage;

      assert.instanceOf(message, GlobaluserstateMessage);

      assert.deepStrictEqual(message.badgeInfo, new TwitchBadgesList());
      assert.strictEqual(message.badgeInfoRaw, "");

      assert.deepStrictEqual(
        message.badges,
        new TwitchBadgesList(new TwitchBadge("bits-charity", "1")),
      );
      assert.strictEqual(message.badgesRaw, "bits-charity/1");

      assert.deepStrictEqual(message.color, { r: 0x19, g: 0xe6, b: 0xe6 });
      assert.strictEqual(message.colorRaw, "#19E6E6");

      assert.strictEqual(message.displayName, "RANDERS");

      assert.deepStrictEqual(message.emoteSets, [
        "0",
        "42",
        "237",
        "1564",
        "1627",
        "1937",
        "2344",
        "2470",
        "4236",
        "14417",
        "15961",
        "19194",
        "198648",
        "241281",
        "445556",
        "520063",
        "771848",
        "905510",
        "1056965",
        "1537462",
        "1598955",
        "1641460",
        "1641461",
        "1641462",
        "300206295",
      ]);
      assert.strictEqual(
        message.emoteSetsRaw,
        "0,42,237,1564,1627,1937,2344,2470,4236,14417,15961,19194,198648," +
          "241281,445556,520063,771848,905510,1056965,1537462,1598955,1641460,1641461,1641462,300206295",
      );

      assert.strictEqual("40286300", message.userID);

      assert.deepStrictEqual(message.extractGlobalUserState(), {
        badgeInfo: new TwitchBadgesList(),
        badgeInfoRaw: "",

        badges: new TwitchBadgesList(new TwitchBadge("bits-charity", "1")),
        badgesRaw: "bits-charity/1",

        color: { r: 0x19, g: 0xe6, b: 0xe6 },
        colorRaw: "#19E6E6",

        displayName: "RANDERS",

        emoteSets: [
          "0",
          "42",
          "237",
          "1564",
          "1627",
          "1937",
          "2344",
          "2470",
          "4236",
          "14417",
          "15961",
          "19194",
          "198648",
          "241281",
          "445556",
          "520063",
          "771848",
          "905510",
          "1056965",
          "1537462",
          "1598955",
          "1641460",
          "1641461",
          "1641462",
          "300206295",
        ],
        emoteSetsRaw:
          "0,42,237,1564,1627,1937,2344,2470,4236,14417,15961,19194,198648," +
          "241281,445556,520063,771848,905510,1056965,1537462,1598955,1641460,1641461,1641462,300206295",

        userID: "40286300",
      });
    });

    it("should be able to parse a real minimal GLOBALUSERSTATE message from twitch", () => {
      const messageText =
        "@badge-info=;badges=;color=;display-name=receivertest3;emote-sets=0;user-id=422021310;" +
        "user-type= :tmi.twitch.tv GLOBALUSERSTATE";

      const message: GlobaluserstateMessage = parseTwitchMessage(
        messageText,
      ) as GlobaluserstateMessage;

      assert.instanceOf(message, GlobaluserstateMessage);

      assert.deepStrictEqual(message.badgeInfo, new TwitchBadgesList());
      assert.strictEqual(message.badgeInfoRaw, "");

      assert.deepStrictEqual(message.badges, new TwitchBadgesList());
      assert.strictEqual(message.badgesRaw, "");

      assert.isUndefined(message.color);
      assert.strictEqual(message.colorRaw, "");

      assert.strictEqual(message.displayName, "receivertest3");

      assert.deepStrictEqual(message.emoteSets, ["0"]);
      assert.strictEqual(message.emoteSetsRaw, "0");

      assert.strictEqual("422021310", message.userID);

      assert.deepStrictEqual(message.extractGlobalUserState(), {
        badgeInfo: new TwitchBadgesList(),
        badgeInfoRaw: "",

        badges: new TwitchBadgesList(),
        badgesRaw: "",

        color: undefined,
        colorRaw: "",

        displayName: "receivertest3",

        emoteSets: ["0"],
        emoteSetsRaw: "0",

        userID: "422021310",
      });
    });

    it("trims spaces at the end of display names", () => {
      const messageText =
        "@badge-info=;badges=;color=;display-name=receivertest3\\s;emote-sets=0;user-id=422021310;" +
        "user-type= :tmi.twitch.tv GLOBALUSERSTATE";

      const message: GlobaluserstateMessage = parseTwitchMessage(
        messageText,
      ) as GlobaluserstateMessage;

      assert.strictEqual(message.displayName, "receivertest3");
      assert.strictEqual(
        message.extractGlobalUserState().displayName,
        "receivertest3",
      );
    });
  });
});
