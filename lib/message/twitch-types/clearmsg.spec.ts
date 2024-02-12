import { assert, describe, it } from "vitest";

import { ClearmsgMessage } from "./clearmsg";
import { parseTwitchMessage } from "../parser/twitch-message";

describe("./message/twitch-types/clearmsg", () => {
  describe("clearmsgMessage", () => {
    it("should be able to parse a real CLEARMSG message from twitch", () => {
      const messageText =
        "@login=supibot;room-id=;target-msg-id=25fd76d9-4731-4907-978e-a391134ebd67;" +
        "tmi-sent-ts=-6795364578871 :tmi.twitch.tv CLEARMSG #randers :Pong! Uptime: 6h, " +
        "15m; Temperature: 54.8°C; Latency to TMI: 183ms; Commands used: 795";

      const message: ClearmsgMessage = parseTwitchMessage(
        messageText,
      ) as ClearmsgMessage;

      assert.strictEqual(Object.getPrototypeOf(message), ClearmsgMessage.prototype);
      assert.strictEqual(message.channelName, "randers");
      assert.strictEqual(message.targetUsername, "supibot");
      assert.strictEqual(
        message.targetMessageID,
        "25fd76d9-4731-4907-978e-a391134ebd67",
      );
      assert.strictEqual(
        message.targetMessageContent,
        "Pong! Uptime: 6h, 15m; Temperature: 54.8°C; " +
          "Latency to TMI: 183ms; Commands used: 795",
      );
    });
  });
});
