import { assert, describe, it } from "vitest";

import { BaseError } from "~/utils/base-error";

describe("./utils/base-error", () => {
  describe("baseError", () => {
    it("should preserve the passed cause", () => {
      const cause = new Error("cause msg");
      const error = new BaseError("error msg", cause);

      assert.strictEqual(error.cause, cause);
      assert.isUndefined(new BaseError("error msg").cause);
    });

    it("should set resulting message to ownMessage: causeMessage if both are non-undefined", () => {
      const cause = new Error("cause msg");
      const error = new BaseError("error msg", cause);

      assert.strictEqual(error.message, "error msg: cause msg");
    });

    it("should set resulting message to causeMessage if only causeMessage is present", () => {
      const cause = new Error("cause msg");
      const error = new BaseError(undefined, cause);

      assert.strictEqual(error.message, "cause msg");
    });

    it(
      "should set resulting message to ownMessage if only ownMessage is " +
        "present (case 1 where cause is present but cause has no message)",
      () => {
        // eslint-disable-next-line unicorn/error-message
        const cause = new Error();
        const error = new BaseError("error msg", cause);

        assert.strictEqual(error.message, "error msg");
      },
    );

    it(
      "should set resulting message to ownMessage if only ownMessage is " +
        "present (case 2 where cause is not present)",
      () => {
        const error = new BaseError("error msg");

        assert.strictEqual(error.message, "error msg");
      },
    );

    it(
      "should set resulting message to empty string if " +
        "cause has no message",
      () => {
        // eslint-disable-next-line unicorn/error-message
        const cause = new Error();
        const error = new BaseError(undefined, cause);

        assert.strictEqual(error.message, "");
      },
    );

    it("should set resulting message to empty string if there is no cause and no message", () => {
      const error = new BaseError();

      assert.strictEqual(error.message, "");
    });
  });
});
