import { assert, describe, it } from "vitest";

import { reasonForValue } from "./reason-for-value";

describe("./utils/reason-for-value", () => {
  describe("#reasonForValue()", () => {
    it('should return "undefined" for undefined', () => {
      // eslint-disable-next-line unicorn/no-useless-undefined
      assert.strictEqual(reasonForValue(undefined), "undefined");
    });
    it('should return "null" for null', () => {
      assert.strictEqual(reasonForValue(null), "null");
    });
    it('should return "empty string" for an empty string', () => {
      assert.strictEqual(reasonForValue(""), "empty string");
    });
    it('should return ""the string value"" for string values', () => {
      assert.strictEqual(reasonForValue("test"), '"test"');
    });
  });
});
