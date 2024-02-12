import { assert, describe, it } from "vitest";

import { decodeValue, parseTags } from "./tags";

describe("./message/parser/tags", () => {
  describe("#decodeValue()", () => {
    it("should decode undefined as null", () => {
      // eslint-disable-next-line unicorn/no-useless-undefined
      assert.isNull(decodeValue(undefined));
    });
    it("should decode empty string as empty string", () => {
      assert.strictEqual("", decodeValue(""));
    });
    it("should decode semicolons", () => {
      assert.strictEqual("abc;def", decodeValue("abc\\:def"));
      assert.strictEqual(";", decodeValue("\\:"));
    });
    it("should decode spaces", () => {
      assert.strictEqual("abc def", decodeValue("abc\\sdef"));
      assert.strictEqual(" ", decodeValue("\\s"));
    });
    it("should decode backslashes", () => {
      assert.strictEqual("abc\\def", decodeValue("abc\\\\def"));
      assert.strictEqual("\\", decodeValue("\\\\"));
    });
    it("should decode CR", () => {
      assert.strictEqual("abc\rdef", decodeValue("abc\\rdef"));
      assert.strictEqual("\r", decodeValue("\\r"));
    });
    it("should decode LF", () => {
      assert.strictEqual("abc\ndef", decodeValue("abc\\ndef"));
      assert.strictEqual("\n", decodeValue("\\n"));
    });
    it("should not apply unescaping multiple times", () => {
      assert.strictEqual("abc\\ndef", decodeValue("abc\\\\ndef"));
    });
    it("should ignore dangling backslashes", () => {
      assert.strictEqual("abc def", decodeValue("abc\\sdef\\"));
    });
    it("should support a combination of all escape sequences", () => {
      assert.strictEqual(
        "abc; \\\r\ndef",
        decodeValue("abc\\:\\s\\\\\\r\\ndef\\"),
      );
    });
  });

  describe("#parseTags()", () => {
    it("should parse no-value tag as null", () => {
      assert.deepStrictEqual(parseTags("enabled"), { enabled: null });
    });

    it("should parse empty-value tag as empty string", () => {
      assert.deepStrictEqual(parseTags("enabled="), { enabled: "" });
    });

    it("should keep boolean/numeric values as-is without coercion", () => {
      assert.deepStrictEqual(parseTags("enabled=1"), { enabled: "1" });
    });

    it("should decode escaped tag values", () => {
      assert.deepStrictEqual(parseTags("message=Hello\\sWorld!"), {
        message: "Hello World!",
      });
    });

    it("should override double tags with the last definition", () => {
      assert.deepStrictEqual(parseTags("message=1;message=2"), {
        message: "2",
      });
    });

    it("should override double tags with the last definition, even if value is null", () => {
      assert.deepStrictEqual(parseTags("message=1;message"), { message: null });
    });

    it("should support multiple different keys", () => {
      assert.deepStrictEqual(parseTags("abc=1;def=2;xd;xd;hi=;abc"), {
        abc: null,
        def: "2",
        xd: null,
        hi: "",
      });
    });
  });
});
