import { assert, describe, it } from "vitest";

import { CapMessage } from "./cap";
import { parseTwitchMessage } from "../parser/twitch-message";

describe("./message/twitch-types/cap", () => {
  describe("capMessage", () => {
    it("should parse a single CAP ACK message", () => {
      const messageText = ":tmi.twitch.tv CAP * ACK :twitch.tv/commands";

      const message = parseTwitchMessage(messageText) as CapMessage;

      assert.instanceOf(message, CapMessage);

      assert.strictEqual(message.subCommand, "ACK");
      assert.deepStrictEqual(message.capabilities, ["twitch.tv/commands"]);
    });

    it("should parse multiple capabilities CAP ACK message", () => {
      const messageText =
        ":tmi.twitch.tv CAP * ACK :twitch.tv/commands twitch.tv/tags twitch.tv/membership";

      const message = parseTwitchMessage(messageText) as CapMessage;

      assert.instanceOf(message, CapMessage);

      assert.strictEqual(message.subCommand, "ACK");
      assert.deepStrictEqual(message.capabilities, [
        "twitch.tv/commands",
        "twitch.tv/tags",
        "twitch.tv/membership",
      ]);
    });

    it("should parse a CAP NAK message", () => {
      const messageText = ":tmi.twitch.tv CAP * NAK :invalid twitch.tv/invalid";

      const message = parseTwitchMessage(messageText) as CapMessage;

      assert.instanceOf(message, CapMessage);

      assert.strictEqual(message.subCommand, "NAK");
      assert.deepStrictEqual(message.capabilities, [
        "invalid",
        "twitch.tv/invalid",
      ]);
    });

    it("should parse a CAP LS message", () => {
      const messageText =
        ":tmi.twitch.tv CAP * LS :twitch.tv/tags twitch.tv/commands twitch.tv/membership";

      const message = parseTwitchMessage(messageText) as CapMessage;

      assert.instanceOf(message, CapMessage);

      assert.strictEqual(message.subCommand, "LS");
      assert.deepStrictEqual(message.capabilities, [
        "twitch.tv/tags",
        "twitch.tv/commands",
        "twitch.tv/membership",
      ]);
    });
  });
});
