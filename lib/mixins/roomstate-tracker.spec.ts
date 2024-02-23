import { promisify } from "node:util";

import { assert, describe, expect, it, vi } from "vitest";

import { RoomStateTracker } from "./roomstate-tracker";
import { fakeClient } from "../utils/helpers.spec";

describe("./mixins/roomstate-tracker", () => {
  describe("roomstateTracker", () => {
    it("should set client.roomstateTracker on the client when applied", () => {
      const { client } = fakeClient(false);
      const roomStateTracker = new RoomStateTracker();

      assert.isUndefined(client.roomStateTracker);

      client.use(roomStateTracker);

      assert.strictEqual(client.roomStateTracker, roomStateTracker);
    });

    it("should save/update incoming ROOMSTATE messages", async () => {
      const { client, emit, emitAndEnd } = fakeClient();
      const roomStateTracker = new RoomStateTracker();

      client.use(roomStateTracker);

      assert.isUndefined(roomStateTracker.getChannelState("randers"));

      emit(
        "@emote-only=0;followers-only=-1;r9k=0;rituals=0;room-id=40286300;slow=0;subs-only=0 :tmi.twitch.tv ROOMSTATE #randers",
      );

      await promisify(setImmediate)();

      assert.deepStrictEqual(roomStateTracker.getChannelState("randers"), {
        emoteOnly: false,
        emoteOnlyRaw: "0",

        followersOnlyDuration: -1,
        followersOnlyDurationRaw: "-1",

        r9k: false,
        r9kRaw: "0",

        slowModeDuration: 0,
        slowModeDurationRaw: "0",

        subscribersOnly: false,
        subscribersOnlyRaw: "0",
      });

      // enable r9k (full roomstate)
      emit(
        "@emote-only=0;followers-only=-1;r9k=1;rituals=0;room-id=40286300;slow=0;subs-only=0 :tmi.twitch.tv ROOMSTATE #randers",
      );

      await promisify(setImmediate)();

      assert.deepStrictEqual(roomStateTracker.getChannelState("randers"), {
        emoteOnly: false,
        emoteOnlyRaw: "0",

        followersOnlyDuration: -1,
        followersOnlyDurationRaw: "-1",

        r9k: true,
        r9kRaw: "1",

        slowModeDuration: 0,
        slowModeDurationRaw: "0",

        subscribersOnly: false,
        subscribersOnlyRaw: "0",
      });

      // enable sub mode (partial roomstate)
      emitAndEnd(
        "@room-id=40286300;subs-only=1 :tmi.twitch.tv ROOMSTATE #randers",
      );
      await promisify(setImmediate)();

      assert.deepStrictEqual(roomStateTracker.getChannelState("randers"), {
        emoteOnly: false,
        emoteOnlyRaw: "0",

        followersOnlyDuration: -1,
        followersOnlyDurationRaw: "-1",

        r9k: true,
        r9kRaw: "1",

        slowModeDuration: 0,
        slowModeDurationRaw: "0",

        subscribersOnly: true,
        subscribersOnlyRaw: "1",
      });
    });

    it("should ignore partial ROOMSTATE messages before the first full ROOMSTATE message", async () => {
      const { client, emitAndEnd } = fakeClient();
      const roomStateTracker = new RoomStateTracker();

      client.use(roomStateTracker);

      assert.isUndefined(roomStateTracker.getChannelState("randers"));

      emitAndEnd(
        "@room-id=40286300;subs-only=1 :tmi.twitch.tv ROOMSTATE #randers",
      );
      await promisify(setImmediate)();

      assert.isUndefined(roomStateTracker.getChannelState("randers"));
    });

    it("should emit newChannelState on new roomstate", async () => {
      const { client, emit } = fakeClient();
      const roomStateTracker = new RoomStateTracker();
      client.use(roomStateTracker);

      const listener = vi.fn();
      roomStateTracker.on("newChannelState", listener);

      emit(
        "@emote-only=0;followers-only=-1;r9k=0;rituals=0;room-id=40286300;slow=0;subs-only=0 :tmi.twitch.tv ROOMSTATE #randers",
      );
      client.destroy();

      await promisify(setImmediate)();

      expect(listener).toBeCalledTimes(1);
      expect(listener).toBeCalledWith(
        "randers",
        roomStateTracker.getChannelState("randers"),
      );
    });

    it("should emit newChannelState on updated roomstate", async () => {
      const { client, emit, emitAndEnd } = fakeClient();
      const roomStateTracker = new RoomStateTracker();
      client.use(roomStateTracker);

      emit(
        "@emote-only=0;followers-only=-1;r9k=0;rituals=0;room-id=40286300;slow=0;subs-only=0 :tmi.twitch.tv ROOMSTATE #randers",
      );

      await promisify(setImmediate)();

      const listener = vi.fn();
      roomStateTracker.on("newChannelState", listener);

      emitAndEnd(
        "@room-id=40286300;subs-only=1 :tmi.twitch.tv ROOMSTATE #randers",
      );

      await promisify(setImmediate)();

      expect(listener).toHaveBeenCalledOnce();
      expect(listener).toHaveBeenCalledWith(
        "randers",
        roomStateTracker.getChannelState("randers"),
      );
    });
  });
});
