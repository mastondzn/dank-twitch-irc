import { assert, describe, it } from "vitest";

import {
  MAX_OUTGOING_COMMAND_LENGTH,
  MAX_OUTGOING_LINE_LENGTH,
} from "./constants";

describe("./constants", () => {
  describe("mAX_OUTGOING_LINE_LENGTH", () => {
    it("should be 4096", () => {
      assert.strictEqual(MAX_OUTGOING_LINE_LENGTH, 4096);
    });
  });

  describe("mAX_OUTGOING_COMMAND_LENGTH", () => {
    it("should be 4094", () => {
      assert.strictEqual(MAX_OUTGOING_COMMAND_LENGTH, 4094);
    });
  });
});
