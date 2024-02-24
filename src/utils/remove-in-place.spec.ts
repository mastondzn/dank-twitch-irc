import { assert, describe, it } from "vitest";

import { removeInPlace } from "./remove-in-place";

describe("./utils/remove-in-place", () => {
  describe("#removeInPlace()", () => {
    it("empty array", () => {
      const array: number[] = [];
      removeInPlace(array, 1);
      assert.deepStrictEqual(array, []);
    });

    it("correct on one", () => {
      const array = [1, 2, 3];
      removeInPlace(array, 2);
      assert.deepStrictEqual(array, [1, 3]);
    });

    it("correct on multiple", () => {
      const array = [1, 2, 3, 2];
      removeInPlace(array, 2);
      assert.deepStrictEqual(array, [1, 3]);
    });

    it("at the start", () => {
      const array = [1, 2, 3];
      removeInPlace(array, 1);
      assert.deepStrictEqual(array, [2, 3]);
    });

    it("at the end", () => {
      const array = [1, 2, 3];
      removeInPlace(array, 2);
      assert.deepStrictEqual(array, [1, 3]);
    });
  });
});
