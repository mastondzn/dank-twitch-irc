import { describe, expect, it } from "vitest";

import { pickBy } from "~/utils/pick-by";

describe("pickBy", () => {
  it("should pick by predicate", () => {
    const obj = { a: 1, b: 2, c: 3 };

    const result = pickBy(obj, (value) => value > 1);

    expect(result).toEqual({
      b: 2,
      c: 3,
    });
  });

  it("should pick by predicate with undefined keys properly", () => {
    const obj = {
      a: 1,
      b: 2,
      c: 3,
      d: undefined,
    };

    const result = pickBy(obj, (value) => value != null);

    expect(Object.keys(obj)).toContain("d");
    expect(Object.keys(result)).not.toContain("d");
  });
});
