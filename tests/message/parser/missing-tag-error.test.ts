import { assert, describe, it } from "vitest";

import { MissingTagError } from "./missing-tag-error";

describe("./message/parser/missing-tag-error", () => {
  describe("missingTagError", () => {
    it("should have a special formatted message on undefined", () => {
      const error = new MissingTagError("exampleKey", undefined);
      assert.strictEqual(
        error.message,
        'Required tag value not present at key "exampleKey" (is undefined)',
      );
    });

    it("should have a special formatted message on null", () => {
      const error = new MissingTagError("exampleKey", null);
      assert.strictEqual(
        error.message,
        'Required tag value not present at key "exampleKey" (is null)',
      );
    });

    it("should have a special formatted message on empty string", () => {
      const error = new MissingTagError("exampleKey", "");
      assert.strictEqual(
        error.message,
        'Required tag value not present at key "exampleKey" (is empty string)',
      );
    });

    it("should have a formatted message on other string values", () => {
      const error = new MissingTagError("exampleKey", "test");
      assert.strictEqual(
        error.message,
        'Required tag value not present at key "exampleKey" (is "test")',
      );
    });

    it("should store the given values as instance properties", () => {
      const error = new MissingTagError("exampleKey", "testValue");
      assert.strictEqual(error.tagKey, "exampleKey");
      assert.strictEqual(error.actualValue, "testValue");
    });
  });
});
