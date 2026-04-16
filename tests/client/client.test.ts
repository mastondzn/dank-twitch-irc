import { assert, describe, it, vi } from "vitest";

import type { IRCMessage } from "~/message/irc/irc-message";
import { fakeClient } from "../helpers";
import { parseTwitchMessage } from "~/message/parser/twitch-message";
import { PongMessage } from "~/message/twitch-types/connection/pong";

describe("collectMessages", () => {
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

    assert.strictEqual((result1.value as IRCMessage).rawSource, msg1.rawSource);
    assert.strictEqual((result2.value as IRCMessage).rawSource, msg2.rawSource);

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
});
