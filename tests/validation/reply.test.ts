import { describe, it } from "vitest";

import { assertThrowsChain } from "../helpers";
import { validateMessageId } from "~/validation/reply";
import { ValidationError } from "~/validation/validation-error";

describe("./validation/reply", () => {
  describe("#validateMessageID()", () => {
    it("rejects undefined", () => {
      assertThrowsChain(
        () => validateMessageId(),
        ValidationError,
        "Message ID undefined is invalid/malformed",
      );
    });

    it("rejects null", () => {
      assertThrowsChain(
        () => validateMessageId(null),
        ValidationError,
        "Message ID null is invalid/malformed",
      );
    });

    it("rejects empty strings", () => {
      assertThrowsChain(
        () => validateMessageId(""),
        ValidationError,
        "Message ID empty string is invalid/malformed",
      );
    });

    it("allows dashes", () => {
      validateMessageId("885196de-cb67-427a-baa8-82f9b0fcd05f");
      validateMessageId("8dfe2f75-a6c6-445a-927d-bfe7ad023c9f");
    });
  });
});
