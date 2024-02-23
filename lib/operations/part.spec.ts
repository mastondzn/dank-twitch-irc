import { assert, describe, it, vi } from "vitest";

import { joinNothingToDo } from "./join";
import { PartError, partChannel, partNothingToDo } from "./part";
import { TimeoutError } from "../await/timeout-error";
import { assertErrorChain, fakeConnection } from "../utils/helpers.spec";

describe("./operations/part", () => {
  describe("#partNothingToDo()", () => {
    it("should be true if channel is not joined or wanted", () => {
      // channel is not joined and is not wanted either
      // (e.g. no join in progress)
      const { client } = fakeConnection();

      client.wantedChannels.clear();

      client.joinedChannels.clear();

      assert.isTrue(partNothingToDo(client, "pajlada"));
    });

    it("should be false if channel is joined but not wanted", () => {
      // e.g. previous PART command failed, and channel remained joined
      // but not wanted.
      const { client } = fakeConnection();

      client.wantedChannels.clear();

      client.joinedChannels.clear();
      client.joinedChannels.add("pajlada");

      assert.isFalse(partNothingToDo(client, "pajlada"));
    });

    it("should be false if channel is not joined but wanted", () => {
      // e.g. JOIN is currently in progress and we want to part already
      // again

      const { client } = fakeConnection();

      client.wantedChannels.clear();
      client.wantedChannels.add("pajlada");

      client.joinedChannels.clear();

      assert.isFalse(partNothingToDo(client, "pajlada"));
    });

    it("should be false if channel is joined and wanted", () => {
      // normal situation where channel is joined and wanted and must be
      // parted.
      const { client } = fakeConnection();

      client.wantedChannels.clear();
      client.wantedChannels.add("pajlada");

      client.joinedChannels.clear();

      assert.isFalse(joinNothingToDo(client, "pajlada"));
    });
  });

  describe("#partChannel()", () => {
    it("should send the correct wire command", () => {
      vi.useFakeTimers();

      const { client, data } = fakeConnection();
      client.joinedChannels.add("pajlada");
      client.wantedChannels.add("pajlada");

      void partChannel(client, "pajlada");

      assert.deepStrictEqual(data, ["PART #pajlada\r\n"]);
    });

    it("should do nothing if channel is neither wanted nor joined", async () => {
      const { client, data } = fakeConnection();

      await partChannel(client, "pajlada");

      assert.deepStrictEqual(data, []);
    });

    it("should remove channel from wanted channels even on timeout error", async () => {
      vi.useFakeTimers();

      const { client, clientError } = fakeConnection();
      client.joinedChannels.add("pajlada");
      client.wantedChannels.add("pajlada");

      const promise = partChannel(client, "pajlada");

      vi.advanceTimersByTime(2000);

      await assertErrorChain(
        promise,
        PartError,
        "Failed to part channel pajlada: Timed out after waiting for response for 2000 milliseconds",
        TimeoutError,
        "Timed out after waiting for response for 2000 milliseconds",
      );

      await assertErrorChain(
        clientError,
        PartError,
        "Failed to part channel pajlada: Timed out after waiting for response for 2000 milliseconds",
        TimeoutError,
        "Timed out after waiting for response for 2000 milliseconds",
      );

      assert.sameMembers([...client.joinedChannels], ["pajlada"]);
      assert.sameMembers([...client.wantedChannels], []);
    });

    it("should remove channel from joined and wanted channels on success", async () => {
      const { client, emitAndEnd, clientError } = fakeConnection();
      client.joinedChannels.add("pajlada");
      client.wantedChannels.add("pajlada");

      const promise = partChannel(client, "pajlada");

      emitAndEnd(
        ":justinfan12345!justinfan12345@justinfan12345.tmi.twitch.tv PART #pajlada",
      );

      await promise;

      assert.sameMembers([...client.joinedChannels], []);
      assert.sameMembers([...client.wantedChannels], []);

      await clientError;
    });
  });
});
