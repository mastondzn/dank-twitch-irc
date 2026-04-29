import { assert, describe, it, vi } from "vitest";

import type { SingleConnection } from "~/client/connection";
import type { IRCMessage } from "~/message/irc/irc-message";
import { fakeClient } from "../helpers";
import { ReconnectError } from "~/functionalities/handle-reconnect-message";
import { parseTwitchMessage } from "~/message/parser/twitch-message";
import { PongMessage } from "~/message/twitch-types/connection/pong";

describe("chatClient", () => {
  describe("#collectMessages()", () => {
    it("should yield all messages without a filter", async () => {
      const { client, emit, end } = fakeClient();
      const collect = client.collectMessages();
      const msg1 = parseTwitchMessage("PONG :tmi.twitch.tv");
      const msg2 = parseTwitchMessage("PONG :tmi.twitch.tv");

      emit(msg1.rawSource);
      emit(msg2.rawSource);

      const result1 = await collect.next();
      const result2 = await collect.next();

      assert.isFalse(result1.done);
      assert.isFalse(result2.done);
      assert.strictEqual(result1.value.rawSource, msg1.rawSource);
      assert.strictEqual(result2.value.rawSource, msg2.rawSource);
      assert.instanceOf(result1.value, PongMessage);
      assert.instanceOf(result2.value, PongMessage);

      end();
      const result3 = await collect.next();
      assert.isTrue(result3.done);
    });

    it("should filter messages by type", async () => {
      const { client, emit, end } = fakeClient();
      const collect = client.collectMessages({
        filter: (msg): msg is PongMessage => msg instanceof PongMessage,
      });

      const msg1 = parseTwitchMessage("PONG :tmi.twitch.tv");
      const msg2 = parseTwitchMessage("PING :tmi.twitch.tv");

      emit(msg2.rawSource);
      emit(msg1.rawSource);

      const result1 = await collect.next();

      assert.isFalse(result1.done);
      assert.instanceOf(result1.value, PongMessage);
      assert.strictEqual(result1.value.rawSource, msg1.rawSource);

      end();
      const result2 = await collect.next();
      assert.isTrue(result2.done);
    });

    it("should queue messages that arrive before consumption", async () => {
      const { client, emit, end } = fakeClient();
      const collect = client.collectMessages();
      const msg1 = parseTwitchMessage("PONG :tmi.twitch.tv");
      const msg2 = parseTwitchMessage("PING :tmi.twitch.tv");

      emit(msg1.rawSource);
      emit(msg2.rawSource);

      const result1 = await collect.next();
      const result2 = await collect.next();

      assert.strictEqual(
        (result1.value as IRCMessage).rawSource,
        msg1.rawSource,
      );
      assert.strictEqual(
        (result2.value as IRCMessage).rawSource,
        msg2.rawSource,
      );

      end();
      const result3 = await collect.next();
      assert.isTrue(result3.done);
    });

    it("should stop iterating on close", async () => {
      const { client, end } = fakeClient();
      const collect = client.collectMessages();

      end();

      const result = await collect.next();
      assert.isTrue(result.done);
    });

    it("should clean up listeners when manually broken out of loop", async () => {
      const { client, emit, end } = fakeClient();
      const collect = client.collectMessages();
      const msg = parseTwitchMessage("PONG :tmi.twitch.tv");

      emit(msg.rawSource);

      const result = await collect.next();
      assert.isFalse(result.done);

      const listenerCountBefore = client.listenerCount("message");

      await collect.return();

      const listenerCountAfter = client.listenerCount("message");

      assert.isBelow(listenerCountAfter, listenerCountBefore);

      end();
    });

    it("should work with for-await-of", async () => {
      const { client, emit, end } = fakeClient();
      const messages: string[] = [];
      const collect = client.collectMessages();
      const msg1 = parseTwitchMessage("PONG :tmi.twitch.tv");
      const msg2 = parseTwitchMessage("PING :tmi.twitch.tv");

      emit(msg1.rawSource);
      emit(msg2.rawSource);

      for await (const message of collect) {
        messages.push(message.rawSource);
        if (messages.length === 2) break;
      }

      assert.deepStrictEqual(messages, [msg1.rawSource, msg2.rawSource]);

      end();
    });

    it("should respect limit option", async () => {
      const { client, emit, end } = fakeClient();
      const collect = client.collectMessages({ limit: 2 });
      const msg1 = parseTwitchMessage("PONG :tmi.twitch.tv");
      const msg2 = parseTwitchMessage("PONG :tmi.twitch.tv");
      const msg3 = parseTwitchMessage("PONG :tmi.twitch.tv");

      emit(msg1.rawSource);
      emit(msg2.rawSource);
      emit(msg3.rawSource);

      const result1 = await collect.next();
      const result2 = await collect.next();
      const result3 = await collect.next();

      assert.isFalse(result1.done);
      assert.strictEqual(result1.value.rawSource, msg1.rawSource);
      assert.isFalse(result2.done);
      assert.strictEqual(result2.value.rawSource, msg2.rawSource);
      assert.isTrue(result3.done);

      end();
    });

    it("should respect limit option with filter", async () => {
      const { client, emit, end } = fakeClient();
      const collect = client.collectMessages({
        filter: (msg): msg is PongMessage => msg instanceof PongMessage,
        limit: 1,
      });

      emit("PING :tmi.twitch.tv");
      emit("PONG :tmi.twitch.tv");
      emit("PONG :tmi.twitch.tv");

      const result1 = await collect.next();
      assert.instanceOf(result1.value, PongMessage);
      assert.isFalse(result1.done);

      const result2 = await collect.next();
      assert.isTrue(result2.done);

      end();
    });

    it("should respect timeout option", async () => {
      vi.useFakeTimers();
      const { client, end } = fakeClient();
      const collect = client.collectMessages({ timeout: 1000 });

      const nextP = collect.next();
      vi.advanceTimersByTime(1000);

      const result = await nextP;
      assert.isTrue(result.done);

      vi.useRealTimers();
      end();
    });

    it("should stop on stopOn predicate (yielding the matching message)", async () => {
      const { client, emit } = fakeClient();
      const collect = client.collectMessages({
        stopOn: (msg) => msg instanceof PongMessage,
      });

      const msg1 = parseTwitchMessage("PONG :tmi.twitch.tv");
      const msg2 = parseTwitchMessage("PONG :tmi.twitch.tv");

      emit(msg1.rawSource);
      emit(msg2.rawSource);

      const result1 = await collect.next();
      assert.isFalse(result1.done);
      assert.strictEqual(result1.value.rawSource, msg1.rawSource);

      const result2 = await collect.next();
      assert.isTrue(result2.done);
    });

    it("should yield stopOn message before stopping", async () => {
      const { client, emit } = fakeClient();
      const collect = client.collectMessages({
        stopOn: (msg) => msg.rawSource.includes("SECOND"),
      });

      const msg1 = parseTwitchMessage("PONG :tmi.twitch.tv");
      const msg2 = parseTwitchMessage("PONG :SECOND");

      emit(msg1.rawSource);
      emit(msg2.rawSource);
      emit("PONG :THIRD");

      const result1 = await collect.next();
      const result2 = await collect.next();
      const result3 = await collect.next();

      assert.isFalse(result1.done);
      assert.isFalse(result2.done);
      assert.strictEqual(result2.value.rawSource, msg2.rawSource);
      assert.isTrue(result3.done);
    });

    it("should work with stopOn and filter together", async () => {
      const { client, emit } = fakeClient();
      const collect = client.collectMessages({
        filter: (msg): msg is PongMessage => msg instanceof PongMessage,
        stopOn: (msg) => msg.rawSource.includes("STOP"),
      });

      emit("PING :tmi.twitch.tv");
      emit("PONG :tmi.twitch.tv");
      emit("PONG :STOP");
      emit("PONG :tmi.twitch.tv");

      const result1 = await collect.next();
      const result2 = await collect.next();
      const result3 = await collect.next();

      assert.isFalse(result1.done);
      assert.isFalse(result2.done);
      assert.isTrue(result3.done);
    });

    it("should work with stopOn in for-await-of loop", async () => {
      const { client, emit } = fakeClient();
      const messages: string[] = [];
      const collect = client.collectMessages({
        stopOn: (msg) => msg.rawSource.includes("STOP"),
      });

      emit("PONG :FIRST");
      emit("PONG :STOP");
      emit("PONG :THIRD");

      for await (const message of collect) {
        messages.push(message.rawSource);
      }

      assert.deepStrictEqual(messages, ["PONG :FIRST", "PONG :STOP"]);
    });
  });

  it("should emit a reconnect event and replace the connection when a RECONNECT message is received", async () => {
    const { client, emit, clientError } = fakeClient();

    // suppress the expected ReconnectError from becoming an unhandled rejection
    clientError.catch((error: unknown) => error);

    const reconnectPromise = new Promise<SingleConnection>((resolve) => {
      client.once("reconnect", (conn) => resolve(conn));
    });

    emit(":tmi.twitch.tv RECONNECT");

    const oldConn = await reconnectPromise;
    assert.notStrictEqual(oldConn, undefined);

    // The old connection should be removed and a new one created
    assert.strictEqual(
      client.connections.includes(oldConn),
      false,
      "old connection should be removed",
    );
    assert.strictEqual(
      client.connections.length >= 1,
      true,
      "a new connection should exist",
    );

    client.destroy();
  });

  it("should emit a ReconnectError on the connection when a RECONNECT message is received", async () => {
    const { client, emit, clientError } = fakeClient();

    // suppress the duplicate rejection from fakeClient's clientError promise
    clientError.catch((error: unknown) => error);

    const errorPromise = new Promise<Error>((resolve) => {
      client.once("error", (error) => resolve(error));
    });

    emit(":tmi.twitch.tv RECONNECT");

    const error = await errorPromise;
    assert.instanceOf(error, ReconnectError);
    assert.strictEqual(
      error.message,
      "RECONNECT command received by server: :tmi.twitch.tv RECONNECT",
    );

    client.destroy();
  });
});
