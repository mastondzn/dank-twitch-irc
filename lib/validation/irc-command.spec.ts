import { describe, it } from "vitest";

import { validateIRCCommand } from "./irc-command";
import { ValidationError } from "./validation-error";
import { assertThrowsChain } from "../utils/helpers.spec";

describe("./validation/irc-command", () => {
  describe("#validateIRCCommand", () => {
    it("should reject newlines", () => {
      assertThrowsChain(
        () => validateIRCCommand("JOIN\n"),
        ValidationError,
        "IRC command may not include \\n or \\r",
      );
      assertThrowsChain(
        () => validateIRCCommand("\n"),
        ValidationError,
        "IRC command may not include \\n or \\r",
      );
      assertThrowsChain(
        () => validateIRCCommand("\nJOIN"),
        ValidationError,
        "IRC command may not include \\n or \\r",
      );
      assertThrowsChain(
        () => validateIRCCommand("JOIN\nJOIN"),
        ValidationError,
        "IRC command may not include \\n or \\r",
      );
    });

    it("should reject carriage returns", () => {
      assertThrowsChain(
        () => validateIRCCommand("JOIN\r"),
        ValidationError,
        "IRC command may not include \\n or \\r",
      );
      assertThrowsChain(
        () => validateIRCCommand("\r"),
        ValidationError,
        "IRC command may not include \\n or \\r",
      );
      assertThrowsChain(
        () => validateIRCCommand("\rJOIN"),
        ValidationError,
        "IRC command may not include \\n or \\r",
      );
      assertThrowsChain(
        () => validateIRCCommand("JOIN\rJOIN"),
        ValidationError,
        "IRC command may not include \\n or \\r",
      );
    });

    it("should pass normal IRC commands", () => {
      validateIRCCommand("JOIN");
      validateIRCCommand("");
      validateIRCCommand("PRIVMSG #forsen :asd");
      validateIRCCommand("JOIN #pajlada");
    });
  });
});
