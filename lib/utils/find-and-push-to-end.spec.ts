import { assert, describe, it } from "vitest";

import { findAndPushToEnd } from "./find-and-push-to-end";

describe("./utils/find-and-push-to-end", () => {
  describe("findAndPushToEnd", () => {
    it("empty array", () => {
      // eslint-disable-next-line ts/no-confusing-void-expression
      assert.isUndefined(findAndPushToEnd([], (element) => element === 1));
    });

    it("no filter match", () => {
      assert.isUndefined(
        findAndPushToEnd([1, 2, 3], (element) => element === 4),
      );
    });

    it("mutated correctly 1", () => {
      const inArray = [1, 2, 3];
      assert.strictEqual(
        findAndPushToEnd(inArray, (element) => element === 1),
        1,
      );

      assert.deepStrictEqual(inArray, [2, 3, 1]);
    });

    it("mutated correctly 2", () => {
      const inArray = [1, 2, 3];
      assert.strictEqual(
        findAndPushToEnd(inArray, (element) => element === 2),
        2,
      );

      assert.deepStrictEqual(inArray, [1, 3, 2]);
    });
  });
});
