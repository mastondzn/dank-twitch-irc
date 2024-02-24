import { assert, describe, it } from "vitest";

import {
  HosttargetMessage,
  parseHostedChannelName,
  parseHosttargetParameter,
  parseViewerCount,
} from "./hosttarget";
import { assertThrowsChain } from "../../utils/helpers.spec";
import { MissingDataError } from "../parser/missing-data-error";
import { ParseError } from "../parser/parse-error";
import { parseTwitchMessage } from "../parser/twitch-message";

describe("./message/twitch-types/hosttarget", () => {
  describe("#parseHostedChannelName()", () => {
    it("should throw a ParseError if passed undefined", () => {
      assertThrowsChain(
        // eslint-disable-next-line unicorn/no-useless-undefined
        () => parseHostedChannelName(undefined),
        ParseError,
        "Malformed channel part in HOSTTARGET message: undefined",
      );
    });

    it("should throw a ParseError if passed an empty string", () => {
      assertThrowsChain(
        () => parseHostedChannelName(""),
        ParseError,
        "Malformed channel part in HOSTTARGET message: empty string",
      );
    });

    it('should return undefined if passed exactly "-"', () => {
      assert.isUndefined(parseHostedChannelName("-"));
    });

    it("should return the input string as-is in all other cases", () => {
      assert.strictEqual("a", parseHostedChannelName("a"));
      assert.strictEqual("xd", parseHostedChannelName("xd"));
      assert.strictEqual("pajlada", parseHostedChannelName("pajlada"));
    });
  });

  describe("#parseViewerCount()", () => {
    it("should throw a ParseError if passed undefined", () => {
      assertThrowsChain(
        // eslint-disable-next-line unicorn/no-useless-undefined
        () => parseViewerCount(undefined),
        ParseError,
        "Malformed viewer count part in HOSTTARGET message: undefined",
      );
    });

    it("should throw a ParseError if passed an empty string", () => {
      assertThrowsChain(
        () => parseViewerCount(""),
        ParseError,
        "Malformed viewer count part in HOSTTARGET message: empty string",
      );
    });

    it("should throw a ParseError if passed an invalid integer string", () => {
      assertThrowsChain(
        () => parseViewerCount("abc"),
        ParseError,
        'Malformed viewer count part in HOSTTARGET message: "abc"',
      );
    });

    it('should return undefined if passed exactly "-"', () => {
      assert.isUndefined(parseViewerCount("-"));
    });

    it("should return a parsed number if passed a value integer value", () => {
      assert.strictEqual(0, parseViewerCount("0"));
      assert.strictEqual(50, parseViewerCount("50"));
    });
  });

  describe("#parsHosttargetParameter()", () => {
    it("should throw a ParseError if passed an empty string", () => {
      assertThrowsChain(
        () => parseHosttargetParameter(""),
        ParseError,
        "HOSTTARGET accepts exactly 2 arguments in second parameter, given: empty string",
      );
    });

    it("should throw a ParseError if given more than 2 arguments", () => {
      assertThrowsChain(
        () => parseHosttargetParameter("a b c"),
        ParseError,
        'HOSTTARGET accepts exactly 2 arguments in second parameter, given: "a b c"',
      );
    });

    it("should parse channel name and viewer count if present", () => {
      assert.deepStrictEqual(parseHosttargetParameter("leebaxd 10"), {
        hostedChannelName: "leebaxd",
        viewerCount: 10,
      });
      assert.deepStrictEqual(parseHosttargetParameter("leebaxd -"), {
        hostedChannelName: "leebaxd",
        viewerCount: undefined,
      });
      assert.deepStrictEqual(parseHosttargetParameter("- 10"), {
        hostedChannelName: undefined,
        viewerCount: 10,
      });
      assert.deepStrictEqual(parseHosttargetParameter("- 0"), {
        hostedChannelName: undefined,
        viewerCount: 0,
      });
      assert.deepStrictEqual(parseHosttargetParameter("- -"), {
        hostedChannelName: undefined,
        viewerCount: undefined,
      });
    });
  });

  describe("hosttargetMessage", () => {
    it("should parse fresh Host-On message", () => {
      const messageText = ":tmi.twitch.tv HOSTTARGET #randers :leebaxd 0";

      const message: HosttargetMessage = parseTwitchMessage(
        messageText,
      ) as HosttargetMessage;

      assert.instanceOf(message, HosttargetMessage);

      assert.strictEqual(message.channelName, "randers");
      assert.strictEqual(message.hostedChannelName, "leebaxd");
      assert.strictEqual(message.viewerCount, 0);

      assert.isFalse(message.wasHostModeExited());
      assert.isTrue(message.wasHostModeEntered());
    });

    it("should parse non-fresh Host-On message", () => {
      const messageText = ":tmi.twitch.tv HOSTTARGET #randers :leebaxd -";

      const message: HosttargetMessage = parseTwitchMessage(
        messageText,
      ) as HosttargetMessage;

      assert.instanceOf(message, HosttargetMessage);

      assert.strictEqual(message.channelName, "randers");
      assert.strictEqual(message.hostedChannelName, "leebaxd");
      assert.isUndefined(message.viewerCount);

      assert.isFalse(message.wasHostModeExited());
      assert.isTrue(message.wasHostModeEntered());
    });

    it("should parse host exit message", () => {
      const messageText = ":tmi.twitch.tv HOSTTARGET #randers :- 0";

      const message: HosttargetMessage = parseTwitchMessage(
        messageText,
      ) as HosttargetMessage;

      assert.instanceOf(message, HosttargetMessage);

      assert.strictEqual(message.channelName, "randers");
      assert.isUndefined(message.hostedChannelName);
      assert.strictEqual(message.viewerCount, 0);

      assert.isTrue(message.wasHostModeExited());
      assert.isFalse(message.wasHostModeEntered());
    });

    it("should require a second IRC parameter to be present", () => {
      const messageText = ":tmi.twitch.tv HOSTTARGET #randers";

      assertThrowsChain(
        () => parseTwitchMessage(messageText),
        MissingDataError,
        "Parameter at index 1 missing",
      );
    });
  });
});
