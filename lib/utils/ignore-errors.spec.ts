/* eslint-disable ts/no-confusing-void-expression */
import { assert, describe, it } from "vitest";

import { ignoreErrors } from "./ignore-errors";

describe("./utils/ignore-errors", () => {
  describe("#ignoreErrors()", () => {
    it("should ignore errors as the first argument and return undefined", () => {
      // @ts-expect-error more arguments than expected
      assert.isUndefined(ignoreErrors(new Error("something bad")));
    });
    it("should return undefined with no arguments", () => {
      assert.isUndefined(ignoreErrors());
    });
    it("should make a rejected promise return undefined if used as catch handler", async () => {
      const promise = Promise.reject(new Error("something bad"));
      assert.isUndefined(await promise.catch(ignoreErrors));
    });
    it("should not alter a resolved promise if used as catch handler", async () => {
      const promise = Promise.resolve("something good");
      assert.strictEqual(await promise.catch(ignoreErrors), "something good");
    });
  });
});
