import { describe, it } from "vitest";

import { assertThrowsChain } from "../helpers";
import { validateChannelName } from "~/validation/channel";
import { ValidationError } from "~/validation/validation-error";

describe("./validation/channel", () => {
  describe("#validateChannelName()", () => {
    it("rejects undefined", () => {
      assertThrowsChain(
        () => validateChannelName(),
        ValidationError,
        "Channel name undefined is invalid/malformed",
      );
    });

    it("rejects null", () => {
      assertThrowsChain(
        () => validateChannelName(null),
        ValidationError,
        "Channel name null is invalid/malformed",
      );
    });

    it("rejects empty strings", () => {
      assertThrowsChain(
        () => validateChannelName(""),
        ValidationError,
        "Channel name empty string is invalid/malformed",
      );
    });

    it("allows single letters", () => {
      validateChannelName("a");
      validateChannelName("b");
      validateChannelName("x");
      validateChannelName("z");
    });

    it("allows underscores", () => {
      validateChannelName("a_b");
      validateChannelName("b___c");
      validateChannelName("lack_of_sanity");
      validateChannelName("just__get__a__house");
    });

    it("rejects uppercase letters", () => {
      assertThrowsChain(
        () => validateChannelName("Pajlada"),
        ValidationError,
        'Channel name "Pajlada" is invalid/malformed',
      );
    });
  });
});
