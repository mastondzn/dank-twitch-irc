import { assert, describe, it } from "vitest";

import { unionSets } from "./union-sets";

describe("./utils/union-sets", () => {
  describe("#unionSets()", () => {
    it("should clone the set if 1 set is given", () => {
      const original = new Set(["a", "c", "b"]);

      const result = unionSets([original]);

      assert.sameMembers([...original], [...result]);

      // check if cloned, not same
      original.add("d");
      assert.strictEqual(original.size, 4);
      assert.strictEqual(result.size, 3);
    });

    it("should union 2 sets", () => {
      const originals = [
        new Set(["a", "b", "c"]),
        new Set(["c", "d", "e", "f"]),
      ];

      const result = unionSets(originals);

      assert.sameMembers(["a", "b", "c", "d", "e", "f"], [...result]);
    });

    it("should union 3 sets", () => {
      const originals = [
        new Set(["a", "b", "c"]),
        new Set(["c", "d", "e", "f"]),
        new Set(["a", "z"]),
      ];

      const result = unionSets(originals);

      assert.sameMembers(["a", "b", "c", "d", "e", "f", "z"], [...result]);
    });
  });
});
