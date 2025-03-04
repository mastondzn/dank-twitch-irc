import { describe, it } from "vitest";

import { assertThrowsChain } from "../helpers";
import { validateIRCCommand } from "~/validation/irc-command";
import { ValidationError } from "~/validation/validation-error";

describe("./validation/irc-command", () => {
  describe("#validateIRCCommand", () => {
    it("should reject newlines", () => {
      assertThrowsChain(
        () => validateIRCCommand("JOIN\n"),
        ValidationError,
        String.raw`IRC command may not include \n or \r`,
      );
      assertThrowsChain(
        () => validateIRCCommand("\n"),
        ValidationError,
        String.raw`IRC command may not include \n or \r`,
      );
      assertThrowsChain(
        () => validateIRCCommand("\nJOIN"),
        ValidationError,
        String.raw`IRC command may not include \n or \r`,
      );
      assertThrowsChain(
        () => validateIRCCommand("JOIN\nJOIN"),
        ValidationError,
        String.raw`IRC command may not include \n or \r`,
      );
    });

    it("should reject carriage returns", () => {
      assertThrowsChain(
        () => validateIRCCommand("JOIN\r"),
        ValidationError,
        String.raw`IRC command may not include \n or \r`,
      );
      assertThrowsChain(
        () => validateIRCCommand("\r"),
        ValidationError,
        String.raw`IRC command may not include \n or \r`,
      );
      assertThrowsChain(
        () => validateIRCCommand("\rJOIN"),
        ValidationError,
        String.raw`IRC command may not include \n or \r`,
      );
      assertThrowsChain(
        () => validateIRCCommand("JOIN\rJOIN"),
        ValidationError,
        String.raw`IRC command may not include \n or \r`,
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
