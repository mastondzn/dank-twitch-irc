import { assert, describe, it } from "vitest";

import { isAnonymousUsername } from "./is-anonymous-username";

describe("./utils/is-anonymous-username", () => {
  describe("#isAnonymousUsername()", () => {
    it("should be true for valid justinfan usernames", () => {
      assert.isTrue(isAnonymousUsername("justinfan12345"));
      assert.isTrue(isAnonymousUsername("justinfan1"));
      assert.isTrue(isAnonymousUsername("justinfan99"));
      assert.isTrue(isAnonymousUsername("justinfan999"));
      assert.isTrue(isAnonymousUsername("justinfan9999"));
      assert.isTrue(isAnonymousUsername("justinfan99999"));
      assert.isTrue(isAnonymousUsername("justinfan999999"));
      assert.isTrue(isAnonymousUsername("justinfan9999999"));
      assert.isTrue(isAnonymousUsername("justinfan99999999"));
    });

    it("should be false if username only matches partially", () => {
      assert.isFalse(isAnonymousUsername("some_justinfan12345"));
      assert.isFalse(isAnonymousUsername("justinfan12345kappa"));
      assert.isFalse(isAnonymousUsername("some_justinfan12345kappa"));
    });

    it("should be false if justinfan is capitalized incorrectly", () => {
      assert.isFalse(isAnonymousUsername("Justinfan12345"));
    });
  });
});
