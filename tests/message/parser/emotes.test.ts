import { assert, describe, it } from "vitest";

import { assertThrowsChain } from "../../helpers";
import { TwitchEmote } from "~/message/emote";
import { parseEmotes } from "~/message/parser/emotes";
import { ParseError } from "~/message/parser/parse-error";

describe("./message/parser/emotes", () => {
  describe("#parseEmotes()", () => {
    it("should parse empty string as no emotes", () => {
      assert.deepStrictEqual(parseEmotes("", ""), []);
    });

    it("should parse single emote", () => {
      assert.deepStrictEqual(parseEmotes(":)", "1:0-1"), [
        new TwitchEmote("1", 0, 2, ":)"),
      ]);
    });

    it("should parse multiple instances of the same emote", () => {
      assert.deepStrictEqual(parseEmotes(":) :)", "1:0-1,3-4"), [
        new TwitchEmote("1", 0, 2, ":)"),
        new TwitchEmote("1", 3, 5, ":)"),
      ]);
    });

    it("should parse multiple emotes in the same message", () => {
      assert.deepStrictEqual(parseEmotes("Kappa Keepo", "25:0-4/1902:6-10"), [
        new TwitchEmote("25", 0, 5, "Kappa"),
        new TwitchEmote("1902", 6, 11, "Keepo"),
      ]);
    });

    it("should sort results by start index", () => {
      assert.deepStrictEqual(
        parseEmotes("Kappa Keepo Kappa", "25:0-4,12-16/1902:6-10"),
        [
          new TwitchEmote("25", 0, 5, "Kappa"),
          new TwitchEmote("1902", 6, 11, "Keepo"),
          new TwitchEmote("25", 12, 17, "Kappa"),
        ],
      );
    });

    it("should throw a ParseError if emote index range has no dash", () => {
      assertThrowsChain(
        () => parseEmotes("", "25:12"),
        ParseError,
        'No - found in emote index range "12"',
      );
    });

    it("should accept non-integer emote IDs", () => {
      assert.deepStrictEqual(parseEmotes(":)", "asd:0-1"), [
        new TwitchEmote("asd", 0, 2, ":)"),
      ]);
    });

    it("should throw a ParseError if the from index is not a valid integer", () => {
      assertThrowsChain(
        () => parseEmotes("", "25:abc-5"),
        ParseError,
        'Invalid integer for string "abc"',
      );
    });

    it("should throw a ParseError if the to index is not a valid integer", () => {
      assertThrowsChain(
        () => parseEmotes("", "25:0-abc"),
        ParseError,
        'Invalid integer for string "abc"',
      );
    });

    it("should gracefully handle it if a end index is out of range (1)", () => {
      assert.deepStrictEqual(parseEmotes("Kappa", "25:0-5"), [
        new TwitchEmote("25", 0, 5, "Kappa"),
      ]);
    });

    it("should gracefully handle it if a start index is out of range (2)", () => {
      assert.deepStrictEqual(parseEmotes("Kappa", "25:1-5"), [
        new TwitchEmote("25", 1, 5, "appa"),
      ]);
    });

    it("should gracefully handle it if an end index is extremely out of range", () => {
      assert.deepStrictEqual(parseEmotes("Kappa", "25:2-10"), [
        new TwitchEmote("25", 2, 5, "ppa"),
      ]);
    });

    it("should parse correctly with emoji present", () => {
      assert.deepStrictEqual(parseEmotes("-tags 👉 <3", "483:8-9"), [
        new TwitchEmote("483", 8, 10, "<3"),
      ]);
    });

    it("should parse multiple instances of the same emote if preceeded by emoji", () => {
      assert.deepStrictEqual(parseEmotes("👉 <3 👉 <3", "445:2-3,7-8"), [
        new TwitchEmote("445", 2, 4, "<3"),
        new TwitchEmote("445", 7, 9, "<3"),
      ]);
    });

    it("should parse multiple emotes in the same message when multiple emojis exist between them", () => {
      assert.deepStrictEqual(
        parseEmotes(
          "🌚 Kappa 🌚 🐈 Keepo 🐈 🎨 KappaRoss 🎨",
          "25:2-6/1902:12-16/70433:22-30",
        ),
        [
          new TwitchEmote("25", 2, 7, "Kappa"),
          new TwitchEmote("1902", 12, 17, "Keepo"),
          new TwitchEmote("70433", 22, 31, "KappaRoss"),
        ],
      );
    });
  });
});
