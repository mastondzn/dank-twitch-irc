import { assert, describe, it } from "vitest";

import { assertThrowsChain } from "../../helpers";
import { TwitchBadge } from "~/message/badge";
import { TwitchBadgesList } from "~/message/badges";
import { TwitchEmote } from "~/message/emote";
import { MissingTagError } from "~/message/parser/missing-tag-error";
import { ParseError } from "~/message/parser/parse-error";
import { type TagValueParser, tagParserFor } from "~/message/parser/tag-values";

describe("./message/parser/tag-values", () => {
  function checkRequire<A extends unknown[]>(
    subject: (
      tagParser: TagValueParser,
    ) => (key: string, ...converterArguments: A) => unknown,
    ...converterArguments: A
  ): void {
    describe("#requireData", () => {
      it("should throw MissingTagError on missing key", () => {
        assertThrowsChain(
          () => subject(tagParserFor({}))("key", ...converterArguments),
          MissingTagError,
          'Required tag value not present at key "key" (is undefined)',
        );
      });

      it("should throw MissingTagError on null value", () => {
        assertThrowsChain(
          () =>
            subject(tagParserFor({ key: null }))("key", ...converterArguments),
          MissingTagError,
          'Required tag value not present at key "key" (is null)',
        );
      });
    });
  }

  function checkGet<A extends unknown[]>(
    subject: (
      tagParser: TagValueParser,
    ) => (key: string, ...converterArguments: A) => unknown,
    ...converterArguments: A
  ): void {
    describe("#getData", () => {
      it("should return undefined on missing key", () => {
        assert.isUndefined(
          subject(tagParserFor({}))("key", ...converterArguments),
        );
      });

      it("should return undefined on null value", () => {
        assert.isUndefined(
          subject(tagParserFor({ key: null }))("key", ...converterArguments),
        );
      });
    });
  }

  describe("#getString(), #requireString()", () => {
    checkGet((p) => p.getString.bind(p));
    checkRequire((p) => p.requireString.bind(p));

    it("should return the value if value exists (also on empty string)", () => {
      assert.strictEqual(
        tagParserFor({ key: "value" }).getString("key"),
        "value",
      );
      assert.strictEqual(
        tagParserFor({ key: "value" }).requireString("key"),
        "value",
      );
      assert.strictEqual(tagParserFor({ key: "" }).getString("key"), "");
      assert.strictEqual(tagParserFor({ key: "" }).requireString("key"), "");
    });
  });

  // eslint-disable-next-line unicorn/consistent-function-scoping
  function checkThrowsUnparseableInt<A extends unknown[]>(
    subject: (
      tagParser: TagValueParser,
    ) => (key: string, ...converterArguments: A) => unknown,
    ...converterArguments: A
  ): void {
    it("should throw ParseError on empty string input", () => {
      assertThrowsChain(
        () => subject(tagParserFor({ key: "" }))("key", ...converterArguments),
        ParseError,
        'Failed to parse integer from tag value ""',
      );
    });
    it("should throw ParseError on invalid integer input", () => {
      assertThrowsChain(
        () =>
          subject(tagParserFor({ key: "abc" }))("key", ...converterArguments),
        ParseError,
        'Failed to parse integer from tag value "abc"',
      );
    });
  }

  describe("#getInt(), #requireInt()", () => {
    checkGet((p) => p.getInt.bind(p));
    checkRequire((p) => p.requireInt.bind(p));

    checkThrowsUnparseableInt((p) => p.getInt.bind(p));
    checkThrowsUnparseableInt((p) => p.requireInt.bind(p));

    it("should return a number if value exists and was parseable", () => {
      assert.strictEqual(15, tagParserFor({ key: "15" }).getInt("key"));
      assert.strictEqual(15, tagParserFor({ key: "15" }).requireInt("key"));
    });
  });

  describe("#getBoolean(), #requireBoolean()", () => {
    checkGet((p) => p.getBoolean.bind(p));
    checkRequire((p) => p.requireBoolean.bind(p));

    checkThrowsUnparseableInt((p) => p.getInt.bind(p));
    checkThrowsUnparseableInt((p) => p.requireInt.bind(p));

    it("should return false if the parsed integer is 0", () => {
      assert.isFalse(tagParserFor({ key: "0" }).getBoolean("key"));
      assert.isFalse(tagParserFor({ key: "0.0" }).getBoolean("key"));
    });

    it("should return false if the parsed integer is non-0", () => {
      assert.isTrue(tagParserFor({ key: "1" }).getBoolean("key"));
      assert.isTrue(tagParserFor({ key: "-1" }).getBoolean("key"));
      assert.isTrue(tagParserFor({ key: "15" }).getBoolean("key"));
      assert.isTrue(tagParserFor({ key: "-15" }).getBoolean("key"));
    });
  });

  describe("#getColor(), #requireColor()", () => {
    checkGet((p) => p.getColor.bind(p));
    checkRequire((p) => p.requireColor.bind(p));

    it("should parse #RRGGBB color input correctly", () => {
      assert.deepStrictEqual(tagParserFor({ key: "#aabbcc" }).getColor("key"), {
        r: 0xaa,
        g: 0xbb,
        b: 0xcc,
      });
      assert.deepStrictEqual(tagParserFor({ key: "#AABBCC" }).getColor("key"), {
        r: 0xaa,
        g: 0xbb,
        b: 0xcc,
      });
      assert.deepStrictEqual(tagParserFor({ key: "#12D3FF" }).getColor("key"), {
        r: 0x12,
        g: 0xd3,
        b: 0xff,
      });
    });

    it("#getColor() should return undefined on empty string input", () => {
      assert.isUndefined(tagParserFor({ key: "" }).getColor("key"));
    });

    it("#requireColor() should throw MissingDataError on empty string input", () => {
      assertThrowsChain(
        () => tagParserFor({ key: "" }).requireColor("key"),
        MissingTagError,
        'Required tag value not present at key "key" (is empty string)',
      );
    });
  });

  describe("#getTimestamp(), #requireTimestamp()", () => {
    checkGet((p) => p.getTimestamp.bind(p));
    checkRequire((p) => p.requireTimestamp.bind(p));
    checkThrowsUnparseableInt((p) => p.getTimestamp.bind(p));
    checkThrowsUnparseableInt((p) => p.requireTimestamp.bind(p));

    it("should interpret given integer values as milliseconds since UTC epoch", () => {
      assert.strictEqual(
        tagParserFor({ key: "1234567" }).requireTimestamp("key").getTime(),
        1_234_567,
      );
    });
  });

  describe("#getBadges(), #requireBadges()", () => {
    checkGet((p) => p.getBadges.bind(p));
    checkRequire((p) => p.requireBadges.bind(p));

    it("should return an empty list on empty string input", () => {
      assert.deepStrictEqual(
        tagParserFor({ key: "" }).getBadges("key"),
        new TwitchBadgesList(),
      );
    });

    it("should return single-element array on single badge", () => {
      assert.deepStrictEqual(
        tagParserFor({ key: "admin/1" }).getBadges("key"),
        new TwitchBadgesList(new TwitchBadge("admin", "1")),
      );
    });

    it("should accept two badges in the tag source", () => {
      assert.deepStrictEqual(
        tagParserFor({ key: "admin/1,subscriber/32" }).getBadges("key"),
        new TwitchBadgesList(
          new TwitchBadge("admin", "1"),
          new TwitchBadge("subscriber", "32"),
        ),
      );
    });

    it("should accept three badges in the tag source", () => {
      assert.deepStrictEqual(
        tagParserFor({ key: "admin/1,subscriber/32,bits/1000" }).getBadges(
          "key",
        ),
        new TwitchBadgesList(
          new TwitchBadge("admin", "1"),
          new TwitchBadge("subscriber", "32"),
          new TwitchBadge("bits", "1000"),
        ),
      );
    });
  });

  describe("#getTagEmotes()", () => {
    checkGet((p) => p.getEmotes.bind(p), "lul");
    // @ts-expect-error ??? not sure why it doesnt like this
    checkRequire((p) => p.requireEmoteSets.bind(p), "lul");

    it("should return an empty list on empty string input", () => {
      const actual = tagParserFor({ key: "" }).getEmotes("key", "test");
      assert.deepStrictEqual(actual, []);
    });

    it("should return single-element array on single emote", () => {
      const actual = tagParserFor({ key: "25:4-8" }).getEmotes(
        "key",
        "asd Kappa def",
      );
      assert.deepStrictEqual(actual, [new TwitchEmote("25", 4, 9, "Kappa")]);
    });

    it("should return 2-element array on 2 identical emotes", () => {
      const actual = tagParserFor({ key: "25:4-8,14-18" }).getEmotes(
        "key",
        "asd Kappa def Kappa def",
      );
      assert.deepStrictEqual(actual, [
        new TwitchEmote("25", 4, 9, "Kappa"),
        new TwitchEmote("25", 14, 19, "Kappa"),
      ]);
    });

    it("should return 2-element array on 2 different emotes", () => {
      const actual = tagParserFor({ key: "25:4-8/1902:14-18" }).getEmotes(
        "key",
        "asd Kappa def Keepo def",
      );
      assert.deepStrictEqual(actual, [
        new TwitchEmote("25", 4, 9, "Kappa"),
        new TwitchEmote("1902", 14, 19, "Keepo"),
      ]);
    });

    it("should return a correctly sorted 3-element array on interleaved emotes", () => {
      const actual = tagParserFor({ key: "25:5-9,27-31/1902:16-20" }).getEmotes(
        "key",
        "test Kappa test Keepo test Kappa",
      );
      assert.deepStrictEqual(actual, [
        new TwitchEmote("25", 5, 10, "Kappa"),
        new TwitchEmote("1902", 16, 21, "Keepo"),
        new TwitchEmote("25", 27, 32, "Kappa"),
      ]);
    });
  });

  describe("#getEmoteSets(), #requireEmoteSets()", () => {
    checkGet((p) => p.getEmoteSets.bind(p));
    checkRequire((p) => p.requireEmoteSets.bind(p));

    it("should return an empty list on empty string input", () => {
      const actual = tagParserFor({ key: "" }).getEmoteSets("key");
      assert.deepStrictEqual(actual, []);
    });

    it("should parse one emote set correctly", () => {
      const actual = tagParserFor({ key: "0" }).getEmoteSets("key");
      assert.deepStrictEqual(actual, ["0"]);
    });

    it("should parse two emote set correctly", () => {
      const actual = tagParserFor({ key: "0,3343" }).getEmoteSets("key");
      assert.deepStrictEqual(actual, ["0", "3343"]);
    });

    it("should parse three emote set correctly", () => {
      // also tests that function preserves order (no sorting)
      const actual = tagParserFor({ key: "0,7897,3343" }).getEmoteSets("key");
      assert.deepStrictEqual(actual, ["0", "7897", "3343"]);
    });
  });
});
