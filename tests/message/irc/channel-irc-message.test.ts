import { assert, describe, it } from "vitest";

import { assertThrowsChain } from "../../helpers";
import { ChannelIRCMessage, getIRCChannelName } from "~/message/irc/channel-irc-message";
import { parseIRCMessage } from "~/message/parser/irc-message";
import { MissingDataError } from "~/message/parser/missing-data-error";
import { ParseError } from "~/message/parser/parse-error";

describe("./message/irc/channel-irc-message", () => {
  describe("#getIRCChannelName()", () => {
    it("should return valid channel names, trimmed of the leading # character", () => {
      assert.strictEqual(
        getIRCChannelName({ ircParameters: ["#pajlada"] }),
        "pajlada",
      );
      assert.strictEqual(getIRCChannelName({ ircParameters: ["#a"] }), "a");
      assert.strictEqual(
        getIRCChannelName({ ircParameters: ["#a", "more arguments"] }),
        "a",
      );
      assert.strictEqual(
        getIRCChannelName({ ircParameters: ["#a", "more", "arguments"] }),
        "a",
      );
    });

    it("should handle chatroom channel ID normally", () => {
      const ircParameters = [
        "#chatrooms:11148817:85c31777-b181-46ab-8e08-73e4ecd7a386",
        "more",
        "arguments",
      ];
      assert.strictEqual(
        getIRCChannelName({ ircParameters }),
        "chatrooms:11148817:85c31777-b181-46ab-8e08-73e4ecd7a386",
      );
    });

    it("should throw ParseError if no argument is present", () => {
      assertThrowsChain(
        () => getIRCChannelName({ ircParameters: [] }),
        MissingDataError,
        "Parameter at index 0 missing",
      );
    });

    it("should throw ParseError on empty first argument", () => {
      assertThrowsChain(
        () => getIRCChannelName({ ircParameters: [""] }),
        ParseError,
        'Received malformed IRC channel name ""',
      );
    });

    it("should throw ParseError if argument does not begin with a # character", () => {
      assertThrowsChain(
        () => getIRCChannelName({ ircParameters: ["abc"] }),
        ParseError,
        'Received malformed IRC channel name "abc"',
      );
      assertThrowsChain(
        () => getIRCChannelName({ ircParameters: ["pajlada"] }),
        ParseError,
        'Received malformed IRC channel name "pajlada"',
      );
    });

    it("should throw ParseError on standalone # character", () => {
      assertThrowsChain(
        () => getIRCChannelName({ ircParameters: ["#"] }),
        ParseError,
        'Received malformed IRC channel name "#"',
      );
    });
  });

  describe("channelIRCMessage", () => {
    it("should parse argument 0 into #channelName", () => {
      const message = new ChannelIRCMessage(
        parseIRCMessage("PRIVMSG #pajlada"),
      );
      assert.strictEqual(message.channelName, "pajlada");
    });

    it("should throw ParseError on error parsing the channel name", () => {
      // some examples from above
      assertThrowsChain(
        () => new ChannelIRCMessage(parseIRCMessage("PRIVMSG #")),
        ParseError,
        'Received malformed IRC channel name "#"',
      );
      assertThrowsChain(
        () => new ChannelIRCMessage(parseIRCMessage("PRIVMSG :")),
        ParseError,
        'Received malformed IRC channel name ""',
      );
      assertThrowsChain(
        () => new ChannelIRCMessage(parseIRCMessage("PRIVMSG")),
        MissingDataError,
        "Parameter at index 0 missing",
      );
    });
  });
});
