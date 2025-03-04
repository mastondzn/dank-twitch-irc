import { assert, describe, it, vi } from "vitest";

import { assertErrorChain, fakeConnection } from "../helpers";
import { ClientError, ConnectionError, MessageError } from "~/client/errors";
import { parseTwitchMessage } from "~/message/parser/twitch-message";
import {
  acknowledgesCapabilities,
  CapabilitiesError,
  deniedAnyCapability,
  requestCapabilities,
} from "~/operations/request-capabilities";

describe("./operations/request-capabilities", () => {
  describe("#acknowledgesCapabilities()", () => {
    it("should only return true if given capabilities are a subset of requested capabilities", () => {
      assert.isTrue(
        acknowledgesCapabilities(["a", "b", "c"])(
          parseTwitchMessage("CAP * ACK :a b c d"),
        ),
      );

      assert.isTrue(
        acknowledgesCapabilities(["a", "b", "c"])(
          parseTwitchMessage("CAP * ACK :c b a"),
        ),
      );

      assert.isFalse(
        acknowledgesCapabilities(["a", "b", "c"])(
          parseTwitchMessage("CAP * ACK :a b"),
        ),
      );
    });

    it("should only consider the ACK subcommand", () => {
      assert.isFalse(
        acknowledgesCapabilities(["a", "b", "c"])(
          parseTwitchMessage("CAP * DEF :a b c"),
        ),
      );
    });
  });

  describe("#deniedAnyCapability()", () => {
    it("should return true if any given capability is rejected", () => {
      assert.isTrue(
        deniedAnyCapability(["a", "b", "c"])(
          parseTwitchMessage("CAP * NAK :a b c"),
        ),
      );

      assert.isTrue(
        deniedAnyCapability(["a", "b", "c"])(
          parseTwitchMessage("CAP * NAK :a"),
        ),
      );

      assert.isTrue(
        deniedAnyCapability(["a", "b", "c"])(
          parseTwitchMessage("CAP * NAK :c"),
        ),
      );

      assert.isFalse(
        deniedAnyCapability(["a", "b", "c"])(
          parseTwitchMessage("CAP * NAK :d"),
        ),
      );
    });

    it("should only consider the NAK subcommand", () => {
      assert.isFalse(
        acknowledgesCapabilities(["a", "b", "c"])(
          parseTwitchMessage("CAP * DEF :a"),
        ),
      );
    });
  });

  describe("#requestCapabilities()", () => {
    it("should send the correct wire command", () => {
      vi.useFakeTimers();

      const { client, data } = fakeConnection();

      void requestCapabilities(client, false);
      void requestCapabilities(client, true);

      assert.deepStrictEqual(data, [
        "CAP REQ :twitch.tv/commands twitch.tv/tags\r\n",
        "CAP REQ :twitch.tv/commands twitch.tv/tags twitch.tv/membership\r\n",
      ]);
    });

    it("should resolve on CAP message acknowledging all capabilities", async () => {
      const { client, clientError, emitAndEnd } = fakeConnection();

      const promise = requestCapabilities(client, false);

      emitAndEnd(":tmi.twitch.tv CAP * ACK :twitch.tv/commands twitch.tv/tags");

      await promise;
      await clientError;
    });

    it("should reject on CAP message rejecting one or more of the requested capabilities", async () => {
      const { client, clientError, emitAndEnd } = fakeConnection();

      const promise = requestCapabilities(client, false);

      emitAndEnd(
        ":tmi.twitch.tv CAP * ACK :twitch.tv/commands",
        ":tmi.twitch.tv CAP * NAK :twitch.tv/tags",
      );

      await assertErrorChain(
        promise,
        CapabilitiesError,
        "Failed to request server capabilities twitch.tv/commands, twitch.tv/tags",
        MessageError,
        "Bad response message: :tmi.twitch.tv CAP * NAK :twitch.tv/tags",
      );

      await assertErrorChain(
        clientError,
        CapabilitiesError,
        "Failed to request server capabilities twitch.tv/commands, twitch.tv/tags",
        MessageError,
        "Bad response message: :tmi.twitch.tv CAP * NAK :twitch.tv/tags",
      );
    });
  });

  describe("capabilitiesError", () => {
    it("should be instanceof ConnectionError", () => {
      assert.instanceOf(new CapabilitiesError("message"), ConnectionError);
    });
    it("should not be instanceof ClientError", () => {
      assert.notInstanceOf(new CapabilitiesError("message"), ClientError);
    });
  });
});
