import { assert, describe, it } from "vitest";

import { setDefaults } from "~/utils/set-defaults";

describe("./utils/set-defaults", () => {
  describe("#setDefaults()", () => {
    it("assigns to empty object", () => {
      assert.deepStrictEqual(setDefaults({}, { a: 1, b: 2 }), { a: 1, b: 2 });
    });

    it("does not override inputs", () => {
      assert.deepStrictEqual(setDefaults({ a: 3 }, { a: 1, b: 2 }), {
        a: 3,
        b: 2,
      });
    });

    it("accepts undefined inputs", () => {
      assert.deepStrictEqual(setDefaults(undefined, { a: 1, b: 2 }), {
        a: 1,
        b: 2,
      });
    });

    it("keeps extra input properties", () => {
      // compiler is no guarantee i want to test for this case too.
      assert.deepStrictEqual(setDefaults({ c: 3 }, { a: 1, b: 2 }), {
        a: 1,
        b: 2,
        c: 3,
      });
    });
  });
});
