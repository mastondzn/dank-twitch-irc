import { assert } from "chai";
import * as sinon from "sinon";
import { ClientError, ConnectionError, MessageError } from "../client/errors";
import { assertErrorChain, fakeConnection } from "../helpers.spec";
import { ValidationError } from "../validation/validation-error";
import { deleteMsg, MessageDeleteError } from "./deleteMsg";

describe("./operations/deleteMsg", function () {
  describe("MessageDeleteError", function () {
    it("should not be instanceof ConnectionError", function () {
      assert.notInstanceOf(
        new MessageDeleteError(
          "amazeful",
          "b34ccfc7-4977-403a-8a94-33c6bac34fb8"
        ),
        ConnectionError
      );
    });
    it("should not be instanceof ClientError", function () {
      assert.notInstanceOf(
        new MessageDeleteError(
          "amazeful",
          "b34ccfc7-4977-403a-8a94-33c6bac34fb8"
        ),
        ClientError
      );
    });
  });

  describe("#deleteMsg()", function () {
    it("should send the correct wire command", async function () {
      sinon.useFakeTimers();
      const { client, data } = fakeConnection();

      deleteMsg(client, "amazeful", "b34ccfc7-4977-403a-8a94-33c6bac34fb8");

      assert.deepStrictEqual(data, [
        "PRIVMSG #amazeful :/delete b34ccfc7-4977-403a-8a94-33c6bac34fb8\r\n",
      ]);
    });

    it("should validate the given channel name", async function () {
      const { client, clientError, end, data } = fakeConnection();

      const promise = deleteMsg(
        client,
        "AMAZEFUL",
        "b34ccfc7-4977-403a-8a94-33c6bac34fb8"
      );
      await assertErrorChain(
        promise,
        ValidationError,
        'Channel name "AMAZEFUL" is invalid/malformed'
      );
      end();
      await clientError;
      assert.isEmpty(data);
    });

    it("should resolve on incoming delete_message_success", async function () {
      const { client, emitAndEnd, clientError } = fakeConnection();

      const promise = deleteMsg(
        client,
        "amazeful",
        "b34ccfc7-4977-403a-8a94-33c6bac34fb8"
      );

      emitAndEnd(
        "@msg-id=delete_message_success :tmi.twitch.tv NOTICE #amazeful :amazeful message was deleted."
      );

      await promise;
      await clientError;
    });

    it("should reject on incoming no_permission", async function () {
      const { client, emitAndEnd, clientError } = fakeConnection();

      const promise = deleteMsg(
        client,
        "amazeful",
        "b34ccfc7-4977-403a-8a94-33c6bac34fb8"
      );

      const response =
        "@msg-id=no_permission :tmi.twitch.tv NOTICE #amazeful " +
        ":You don't have permission to perform that action.";
      emitAndEnd(response);

      await assertErrorChain(
        [promise, clientError],
        MessageDeleteError,
        "Failed to delete b34ccfc7-4977-403a-8a94-33c6bac34fb8 in #amazeful: Bad response message: " +
          response,
        MessageError,
        "Bad response message: " + response
      );
    });
  });
});
