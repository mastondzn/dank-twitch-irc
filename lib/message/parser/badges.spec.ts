import { assert, describe, it } from "vitest";

import { parseBadges, parseSingleBadge } from "./badges";
import { ParseError } from "./parse-error";
import { assertThrowsChain } from "../../utils/helpers.spec";
import { TwitchBadge } from "../badge";
import { TwitchBadgesList } from "../badges";

describe("./message/parser/badges", () => {
  describe("#parseSingleBadge()", () => {
    it("should parse correct badge normally", () => {
      assert.deepStrictEqual(
        parseSingleBadge("subscriber/24"),
        new TwitchBadge("subscriber", "24"),
      );
      assert.deepStrictEqual(
        parseSingleBadge("subscriber/12"),
        new TwitchBadge("subscriber", "12"),
      );
      assert.deepStrictEqual(
        parseSingleBadge("vip/1"),
        new TwitchBadge("vip", "1"),
      );
    });

    it("should parse prediction badge & badge-info", () => {
      assert.deepStrictEqual(
        parseSingleBadge("predictions/blue-1"),
        new TwitchBadge("predictions", "blue-1"),
      );
      assert.deepStrictEqual(
        parseSingleBadge("predictions/foo bar\\n baz"),
        new TwitchBadge("predictions", "foo bar\\n baz"),
      );
      assert.deepStrictEqual(
        parseSingleBadge("predictions/<<<<<< HEAD[15A⸝asdf/test"),
        new TwitchBadge("predictions", "<<<<<< HEAD[15A,asdf/test"),
      );
      assert.deepStrictEqual(
        parseSingleBadge("predictions/<<<<<< HEAD[15A⸝asdf⸝/test/"),
        new TwitchBadge("predictions", "<<<<<< HEAD[15A,asdf,/test/"),
      );
    });

    it("should preserve non-integer versions as-is", () => {
      assert.deepStrictEqual(
        parseSingleBadge("vip/1.0"),
        new TwitchBadge("vip", "1.0"),
      );
      assert.deepStrictEqual(
        parseSingleBadge("vip/1.0000"),
        new TwitchBadge("vip", "1.0000"),
      );
      assert.deepStrictEqual(
        parseSingleBadge("vip/01"),
        new TwitchBadge("vip", "01"),
      );
      assert.deepStrictEqual(
        parseSingleBadge("vip/00001"),
        new TwitchBadge("vip", "00001"),
      );
      assert.deepStrictEqual(
        parseSingleBadge("vip/special"),
        new TwitchBadge("vip", "special"),
      );
    });

    it("should throw ParseError if no / is present", () => {
      assertThrowsChain(
        () => parseSingleBadge("subscriber12"),
        ParseError,
        "Badge source \"subscriber12\" did not contain '/' character",
      );
      assertThrowsChain(
        () => parseSingleBadge(""),
        ParseError,
        "Badge source \"\" did not contain '/' character",
      );
      assertThrowsChain(
        () => parseSingleBadge("test"),
        ParseError,
        "Badge source \"test\" did not contain '/' character",
      );
    });

    it("should throw ParseError if badge name is empty", () => {
      assertThrowsChain(
        () => parseSingleBadge("/5"),
        ParseError,
        'Empty badge name on badge "/5"',
      );
      assertThrowsChain(
        () => parseSingleBadge("/"),
        ParseError,
        'Empty badge name on badge "/"',
      );
    });

    it("should throw ParseError if badge version is empty", () => {
      assertThrowsChain(
        () => parseSingleBadge("subscriber/"),
        ParseError,
        'Empty badge version on badge "subscriber/"',
      );
    });
  });

  describe("#parseBadges()", () => {
    it("should parse empty string as empty list", () => {
      assert.deepStrictEqual(parseBadges(""), new TwitchBadgesList());
    });

    it("should parse badges tag with 1 badge correctly", () => {
      const expected = new TwitchBadgesList();
      expected.push(new TwitchBadge("subscriber", "1"));

      assert.deepStrictEqual(parseBadges("subscriber/1"), expected);
    });

    it("should parse badges tag with 2 badges correctly", () => {
      const expected = new TwitchBadgesList();
      expected.push(
        new TwitchBadge("subscriber", "12"),
        new TwitchBadge("vip", "1"),
      );

      assert.deepStrictEqual(parseBadges("subscriber/12,vip/1"), expected);
    });

    it("should parse badges tag with 3 badges correctly", () => {
      const expected = new TwitchBadgesList();
      expected.push(
        new TwitchBadge("subscriber", "12"),
        new TwitchBadge("vip", "1"),
        new TwitchBadge("staff", "1"),
      );

      assert.deepStrictEqual(
        parseBadges("subscriber/12,vip/1,staff/1"),
        expected,
      );
    });
  });
});
