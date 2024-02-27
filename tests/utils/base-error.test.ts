import { assert, describe, it } from "vitest";

import { BaseError } from "~/utils/base-error";

describe("./utils/base-error", () => {
  describe(BaseError, () => {
    it("should preserve the passed cause", () => {
      const cause = new Error("cause msg");
      const error = new BaseError("error msg", cause);

      assert.strictEqual(error.cause, cause);
      assert.isUndefined(new BaseError("error msg").cause);
    });
  });
});
