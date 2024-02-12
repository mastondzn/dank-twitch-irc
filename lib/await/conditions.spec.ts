import { assert, describe, it } from "vitest";

import { matchingNotice } from "./conditions";
import { parseTwitchMessage } from "../message/parser/twitch-message";

describe("./await/conditions", () => {
  describe("#matchingNotice()", () => {
    it("should not match anything that's not a NOTICE", () => {
      const message = parseTwitchMessage(
        "@msg-id=timeout_success :tmi.twitch.tv TEST #pajlada :WEEB123 has been timed out for 1 second.",
      );
      assert.isFalse(matchingNotice("pajlada", ["timeout_success"])(message));
    });

    it("should not match anything from the wrong channel", () => {
      const message = parseTwitchMessage(
        "@msg-id=timeout_success :tmi.twitch.tv NOTICE #forsen :WEEB123 has been timed out for 1 second.",
      );
      assert.isFalse(matchingNotice("pajlada", ["timeout_success"])(message));
    });

    it("should not match any non-matching notice IDs", () => {
      const message = parseTwitchMessage(
        "@msg-id=timeout_success :tmi.twitch.tv NOTICE #pajlada :WEEB123 has been timed out for 1 second.",
      );
      assert.isFalse(matchingNotice("pajlada", ["timeout_success_lol"])(message));
      assert.isTrue(matchingNotice("pajlada", ["timeout_success"])(message));
    });

    it("should return false if msg-id is not present on the NOTICE message", () => {
      const message = parseTwitchMessage(
        ":tmi.twitch.tv NOTICE #pajlada :WEEB123 has been timed out for 1 second.",
      );
      assert.isFalse(matchingNotice("pajlada", ["timeout_success"])(message));
    });

    it("should return true for matching message", () => {
      const message1 = parseTwitchMessage(
        "@msg-id=timeout_success :tmi.twitch.tv NOTICE #pajlada :WEEB123 has been timed out for 1 second.",
      );
      assert.isTrue(
        matchingNotice("pajlada", ["timeout_success", "lol"])(message1),
      );

      const message2 = parseTwitchMessage(
        "@msg-id=lol :tmi.twitch.tv NOTICE #pajlada :WEEB123 has been timed out for 1 second.",
      );
      assert.isTrue(
        matchingNotice("pajlada", ["timeout_success", "lol"])(message2),
      );
    });
  });
});
