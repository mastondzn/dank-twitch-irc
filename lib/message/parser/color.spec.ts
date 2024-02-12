import { assert, describe, it } from "vitest";

import { parseColor } from "./color";
import { ParseError } from "./parse-error";
import { assertThrowsChain } from "../../utils/helpers.spec";


describe("./message/parser/color", () => {
  describe("#parseColor()", () => {
    it("should parse numeric color string", () => {
      assert.deepStrictEqual(parseColor("#000000"), {
        r: 0x00,
        g: 0x00,
        b: 0x00,
      });
      assert.deepStrictEqual(parseColor("#123456"), {
        r: 0x12,
        g: 0x34,
        b: 0x56,
      });
      assert.deepStrictEqual(parseColor("#789011"), {
        r: 0x78,
        g: 0x90,
        b: 0x11,
      });
    });

    it("should parse uppercase hex color string", () => {
      assert.deepStrictEqual(parseColor("#AABBCC"), {
        r: 0xAA,
        g: 0xBB,
        b: 0xCC,
      });
      assert.deepStrictEqual(parseColor("#FFFFFF"), {
        r: 0xFF,
        g: 0xFF,
        b: 0xFF,
      });
    });

    it("should parse lowercase hex color string", () => {
      assert.deepStrictEqual(parseColor("#aabbcc"), {
        r: 0xAA,
        g: 0xBB,
        b: 0xCC,
      });
      assert.deepStrictEqual(parseColor("#ffffff"), {
        r: 0xFF,
        g: 0xFF,
        b: 0xFF,
      });
    });

    it("should parse mixed-case hex color string", () => {
      assert.deepStrictEqual(parseColor("#aAbBcC"), {
        r: 0xAA,
        g: 0xBB,
        b: 0xCC,
      });
      assert.deepStrictEqual(parseColor("#FFffFF"), {
        r: 0xFF,
        g: 0xFF,
        b: 0xFF,
      });
    });

    it("should parse alphanumeric hex color string", () => {
      assert.deepStrictEqual(parseColor("#A7F1FF"), {
        r: 0xA7,
        g: 0xF1,
        b: 0xFF,
      });
      assert.deepStrictEqual(parseColor("#FF00FF"), {
        r: 0xFF,
        g: 0x00,
        b: 0xFF,
      });
    });

    it("should throw ParseError on missing leading hash", () => {
      assertThrowsChain(
        () => parseColor("aabbcc"),
        ParseError,
        'Malformed color value "aabbcc", must be in format #AABBCC',
      );
    });

    it("should throw ParseError on too-long input string", () => {
      assertThrowsChain(
        () => parseColor("aabbccFF"),
        ParseError,
        'Malformed color value "aabbccFF", must be in format #AABBCC',
      );
    });

    it("should throw ParseError on too-short input string", () => {
      assertThrowsChain(
        () => parseColor("aabbc"),
        ParseError,
        'Malformed color value "aabbc", must be in format #AABBCC',
      );
    });

    it("should throw ParseError on out-of-range hex characters input string", () => {
      assertThrowsChain(
        () => parseColor("AAAEAA"),
        ParseError,
        'Malformed color value "AAAEAA", must be in format #AABBCC',
      );
    });
  });
});
