import { assert, describe, it, vi } from "vitest";

import { assertErrorChain, fakeConnection } from "../helpers";
import { TimeoutError } from "~/await/timeout-error";
import { ClientError, ConnectionError } from "~/client/errors";
import { PingTimeoutError, sendPing } from "~/operations/ping";

describe("./operations/ping", () => {
  describe("#sendPing()", () => {
    it("should send the correct wire command if ping identifier is specified", () => {
      vi.useFakeTimers(); // prevent the promise timing out
      const { data, client } = fakeConnection();

      void sendPing(client, "some identifier");

      assert.deepStrictEqual(data, ["PING :some identifier\r\n"]);
    });

    it("should send a random ping identifier if no ping identifier is specified", () => {
      vi.useFakeTimers(); // prevent the promise timing out
      const { data, client } = fakeConnection();

      void sendPing(client);

      assert.strictEqual(data.length, 1);
      assert.match(
        data[0] as string,
        /^PING :dank-twitch-irc:manual:[\da-f]{32}\r\n$/,
      );
    });

    it("should resolve on matching PONG", async () => {
      const { client, emitAndEnd, clientError } = fakeConnection();

      const promise = sendPing(client, "some identifier");

      emitAndEnd(":tmi.twitch.tv PONG tmi.twitch.tv :some identifier");

      const pongMessage = await promise;
      assert.strictEqual(pongMessage.argument, "some identifier");

      await clientError;
    });

    it("should reject on timeout of 2000 milliseconds by default", async () => {
      vi.useFakeTimers();
      const { client, clientError } = fakeConnection();

      const promise = sendPing(client, "some identifier");

      vi.advanceTimersByTime(2000);

      await assertErrorChain(
        promise,
        PingTimeoutError,
        "Server did not PONG back",
        TimeoutError,
        "Timed out after waiting for response for 2000 milliseconds",
      );

      await assertErrorChain(
        clientError,
        PingTimeoutError,
        "Server did not PONG back",
        TimeoutError,
        "Timed out after waiting for response for 2000 milliseconds",
      );
    });
  });

  describe("pingTimeoutError", () => {
    it("should be instanceof ConnectionError", () => {
      assert.instanceOf(new PingTimeoutError("message"), ConnectionError);
    });
    it("should not be instanceof ClientError", () => {
      assert.notInstanceOf(new PingTimeoutError("message"), ClientError);
    });
  });
});
