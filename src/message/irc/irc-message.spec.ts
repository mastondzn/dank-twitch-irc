import { assert, describe, it } from "vitest";

import { requireNickname, requireParameter } from "./irc-message";
import { assertThrowsChain } from "../../utils/helpers.spec";
import { parseIRCMessage } from "../parser/irc-message";
import { MissingDataError } from "../parser/missing-data-error";

describe("./message/irc/irc-message", () => {
  describe("#requireParameter()", () => {
    it("should throw MissingDataError if parameters have length 0", () => {
      assertThrowsChain(
        () => requireParameter({ ircParameters: [] }, 0),
        MissingDataError,
        "Parameter at index 0 missing",
      );
      assertThrowsChain(
        () => requireParameter({ ircParameters: [] }, 1),
        MissingDataError,
        "Parameter at index 1 missing",
      );
      assertThrowsChain(
        () => requireParameter({ ircParameters: [] }, 2),
        MissingDataError,
        "Parameter at index 2 missing",
      );
    });

    it("should be able to return parameter 0 if parameters have length 1", () => {
      assert.strictEqual(
        "test parameter",
        requireParameter({ ircParameters: ["test parameter"] }, 0),
      );
      assertThrowsChain(
        () => requireParameter({ ircParameters: ["test parameter"] }, 1),
        MissingDataError,
        "Parameter at index 1 missing",
      );
      assertThrowsChain(
        () => requireParameter({ ircParameters: ["test parameter"] }, 2),
        MissingDataError,
        "Parameter at index 2 missing",
      );
    });

    it("should be able to return parameter 0 and 1 if parameters have length 2", () => {
      assert.strictEqual(
        "test",
        requireParameter({ ircParameters: ["test", "parameters"] }, 0),
      );
      assert.strictEqual(
        "parameters",
        requireParameter({ ircParameters: ["test", "parameters"] }, 1),
      );
      assertThrowsChain(
        () => requireParameter({ ircParameters: ["test", "parameters"] }, 2),
        MissingDataError,
        "Parameter at index 2 missing",
      );
    });
  });

  describe("#getNickname()", () => {
    it("should throw MissingDataError if nickname or prefix is missing", () => {
      assertThrowsChain(
        () => requireNickname(parseIRCMessage("JOIN #pajlada")),
        MissingDataError,
        "Missing prefix or missing nickname in prefix",
      );

      assertThrowsChain(
        () => requireNickname(parseIRCMessage(":tmi.twitch.tv JOIN #pajlada")),
        MissingDataError,
        "Missing prefix or missing nickname in prefix",
      );
    });

    it("should return the nickname otherwise", () => {
      const message = parseIRCMessage(
        ":leppunen!LEPPUNEN@lePPunen.tmi.twitch.tv JOIN #pajlada",
      );
      assert.strictEqual(requireNickname(message), "leppunen");
    });
  });
});
