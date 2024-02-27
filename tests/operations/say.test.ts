import { assert, describe, it, vi } from "vitest";

import { assertErrorChain, fakeConnection } from "../helpers";
import { ClientError, ConnectionError, MessageError } from "~/client/errors";
import { SayError, me, removeCommands, say } from "~/operations/say";

describe("./operations/say", () => {
  describe("#removeCommands()", () => {
    it("should remove all twitch commands", () => {
      assert.strictEqual(removeCommands("/me hi"), "/ /me hi");
      assert.strictEqual(removeCommands(".me hi"), "/ .me hi");
      assert.strictEqual(
        removeCommands("/timeout weeb123 5"),
        "/ /timeout weeb123 5",
      );
    });

    it("should not prepend a slash to other messages", () => {
      assert.strictEqual(removeCommands(""), "");
      assert.strictEqual(removeCommands("\\me hi"), "\\me hi");
      assert.strictEqual(removeCommands("hello world!"), "hello world!");
    });
  });

  describe("sayError", () => {
    it("should not be instanceof ConnectionError", () => {
      assert.notInstanceOf(
        new SayError("pajlada", "test", true, "error message"),
        ConnectionError,
      );
    });
    it("should not be instanceof ClientError", () => {
      assert.notInstanceOf(
        new SayError("pajlada", "test", true, "error message"),
        ClientError,
      );
    });
  });

  describe("#say()", () => {
    it("should send the correct wire command", () => {
      vi.useFakeTimers();
      const { data, client } = fakeConnection();

      void say(client, "pajlada", "/test test abc KKona");

      assert.deepStrictEqual(data, [
        "PRIVMSG #pajlada :/ /test test abc KKona\r\n",
      ]);
    });

    it("should resolve on USERSTATE", async () => {
      const { client, clientError, emitAndEnd } = fakeConnection();

      const promise = say(client, "pajlada", "/test test abc KKona");

      const userstateResponse =
        "@badge-info=;badges=;color=;display-name=justinfan12345;emote-sets=0;mod=0;" +
        "subscriber=0;user-type= :tmi.twitch.tv USERSTATE #pajlada";
      emitAndEnd(userstateResponse);

      const response = await promise;
      assert.strictEqual(response.rawSource, userstateResponse);

      await clientError;
    });

    it("should reject on msg_channel_suspended", async () => {
      const { client, clientError, emitAndEnd } = fakeConnection();

      const promise = say(client, "pajlada", "abc def");

      emitAndEnd(
        "@msg-id=msg_channel_suspended :tmi.twitch.tv NOTICE" +
          " #pajlada :This channel has been suspended.",
      );

      await assertErrorChain(
        promise,
        SayError,
        "Failed to say [#pajlada]: abc def",
        MessageError,
        "Bad response message: @msg-id=msg_channel_suspended :tmi.twit" +
          "ch.tv NOTICE #pajlada :This channel has been suspended.",
      );

      await assertErrorChain(
        clientError,
        SayError,
        "Failed to say [#pajlada]: abc def",
        MessageError,
        "Bad response message: @msg-id=msg_channel_suspended :tmi.twitc" +
          "h.tv NOTICE #pajlada :This channel has been suspended.",
      );
    });
  });

  describe("#me()", () => {
    it("should send the correct wire command", () => {
      vi.useFakeTimers();
      const { data, client } = fakeConnection();

      void me(client, "pajlada", "test abc KKona");

      assert.deepStrictEqual(data, [
        "PRIVMSG #pajlada :/me test abc KKona\r\n",
      ]);
    });

    it("should resolve on USERSTATE", async () => {
      const { client, clientError, emitAndEnd } = fakeConnection();

      const promise = me(client, "pajlada", "test test abc KKona");

      const userstateResponse =
        "@badge-info=;badges=;color=;display-name=justinfan12345;emote-sets=0;mod=0;" +
        "subscriber=0;user-type= :tmi.twitch.tv USERSTATE #pajlada";
      emitAndEnd(userstateResponse);

      const response = await promise;
      assert.strictEqual(response.rawSource, userstateResponse);

      await clientError;
    });

    it("should reject on msg_channel_suspended", async () => {
      const { client, clientError, emitAndEnd } = fakeConnection();

      const promise = me(client, "pajlada", "abc def");

      emitAndEnd(
        "@msg-id=msg_channel_suspended :tmi.twitch.tv NOTICE" +
          " #pajlada :This channel has been suspended.",
      );

      await assertErrorChain(
        promise,
        SayError,
        "Failed to say [#pajlada]: /me abc def",
        MessageError,
        "Bad response message: @msg-id=msg_channel_suspended :tmi.twit" +
          "ch.tv NOTICE #pajlada :This channel has been suspended.",
      );

      await assertErrorChain(
        clientError,
        SayError,
        "Failed to say [#pajlada]: /me abc def",
        MessageError,
        "Bad response message: @msg-id=msg_channel_suspended :tmi.twitc" +
          "h.tv NOTICE #pajlada :This channel has been suspended.",
      );
    });
  });
});
