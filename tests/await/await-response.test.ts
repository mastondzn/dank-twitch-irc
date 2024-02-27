import { assert, describe, it, vi } from "vitest";

import { assertErrorChain, fakeConnection } from "../helpers";
import { ResponseAwaiter, awaitResponse } from "~/await/await-response";
import { TimeoutError } from "~/await/timeout-error";
import { ConnectionError, MessageError } from "~/client/errors";
import { parseTwitchMessage } from "~/message/parser/twitch-message";
import { BaseError } from "~/utils/base-error";
import { ignoreErrors } from "~/utils/ignore-errors";

describe("./await/await-response", () => {
  describe("responseAwaiter", () => {
    it("should add itself to list of waiters", () => {
      const { client, end } = fakeConnection();

      const awaiter1 = new ResponseAwaiter(client, {
        errorType: (message, cause) => new BaseError(message, cause),
        errorMessage: "test awaiter 1 failure",
      });
      awaiter1.promise.catch(ignoreErrors);

      const awaiter2 = new ResponseAwaiter(client, {
        errorType: (message, cause) => new BaseError(message, cause),
        errorMessage: "test awaiter 2 failure",
      });
      awaiter2.promise.catch(ignoreErrors);

      assert.deepStrictEqual(client.pendingResponses, [awaiter1, awaiter2]);

      end();
    });

    it("should resolve on matching incoming message", async () => {
      const { client, end } = fakeConnection();

      const wantedMessage = parseTwitchMessage("PONG :tmi.twitch.tv");

      const promise = awaitResponse(client, {
        success: (message) => message === wantedMessage,
        errorType: (message, cause) => new BaseError(message, cause),
        errorMessage: "test awaiter failure",
      });

      client.emitMessage(wantedMessage);

      end();

      assert.strictEqual(await promise, wantedMessage);
      assert.deepStrictEqual(client.pendingResponses, []);
    });

    it("should reject on matching incoming message", async () => {
      const { client, clientError, emitAndEnd } = fakeConnection();

      const wantedMessage = "PONG :tmi.twitch.tv";

      const promise = awaitResponse(client, {
        failure: (message) => message.rawSource === wantedMessage,
        errorType: (message, cause) => new BaseError(message, cause),
        errorMessage: "test awaiter failure",
      });

      emitAndEnd(wantedMessage);

      await assertErrorChain(
        promise,
        BaseError,
        "test awaiter failure",
        MessageError,
        "Bad response message: PONG :tmi.twitch.tv",
      );
      assert.deepStrictEqual(client.pendingResponses, []);

      await assertErrorChain(
        clientError,
        BaseError,
        "test awaiter failure",
        MessageError,
        "Bad response message: PONG :tmi.twitch.tv",
      );
    });

    it("should reject on connection close (no error)", async () => {
      const { client, end, clientError } = fakeConnection();

      const promise = awaitResponse(client, {
        errorType: (message, cause) => new BaseError(message, cause),
        errorMessage: "test awaiter failure",
      });

      end();

      const clientErrorAfterClose = new Promise((resolve, reject) => {
        client.once("error", reject);
      });

      await assertErrorChain(
        [promise, clientErrorAfterClose],
        BaseError,
        "test awaiter failure",
        ConnectionError,
        "Connection closed with no error",
      );

      // the client is closed so the error occurring after close is not
      // emitted -> clientError is resolved because on("close") happens
      // before our ResponseAwaiter emits the error
      await clientError;
    });

    it("should reject on connection close (with error)", async () => {
      const { client, end, clientError } = fakeConnection();

      const promise = awaitResponse(client, {
        errorType: (message, cause) => new BaseError(message, cause),
        errorMessage: "test awaiter failure",
      });

      end(new Error("peer reset connection"));

      // TODO create a utility to await error no #N on arbitrary EventEmitter
      const clientErrorAfterClose = new Promise((resolve, reject) => {
        let counter = 0;
        const target = 1;
        client.on("error", (error) => {
          if (counter++ === target) {
            reject(error);
          }
        });
      });

      await assertErrorChain(
        promise,
        BaseError,
        "test awaiter failure",
        ConnectionError,
        "Connection closed due to error",
        ConnectionError,
        "Error occurred in transport layer",
        Error,
        "peer reset connection",
      );

      await assertErrorChain(
        clientError,
        ConnectionError,
        "Error occurred in transport layer",
        Error,
        "peer reset connection",
      );

      await assertErrorChain(
        clientErrorAfterClose,
        BaseError,
        "test awaiter failure",
        ConnectionError,
        "Connection closed due to error",
        ConnectionError,
        "Error occurred in transport layer",
        Error,
        "peer reset connection",
      );
    });

    it("should timeout after specified timeout (noResponseAction = failure)", async () => {
      vi.useFakeTimers();
      const { client, clientError } = fakeConnection();

      // awaiter is going to be the only awaiter in the queue so
      // it starts the timeout
      // awaiters should wait until they are at the head of the queue
      // to start their timeout
      const promise = awaitResponse(client, {
        errorType: (message, cause) => new BaseError(message, cause),
        errorMessage: "test awaiter failure",
        timeout: 3000,
      });

      vi.advanceTimersByTime(3000);

      await assertErrorChain(
        [promise, clientError],
        BaseError,
        "test awaiter failure",
        TimeoutError,
        "Timed out after waiting for response for 3000 milliseconds",
      );
    });

    it("should timeout after specified timeout (noResponseAction = success)", async () => {
      vi.useFakeTimers();
      const { client, clientError, end } = fakeConnection();

      // awaiter is going to be the only awaiter in the queue so
      // it starts the timeout
      // awaiters should wait until they are at the head of the queue
      // to start their timeout
      const promise = awaitResponse(client, {
        errorType: (message, cause) => new BaseError(message, cause),
        errorMessage: "test awaiter failure",
        timeout: 3000,
        noResponseAction: "success",
      });

      vi.advanceTimersByTime(3000);
      end();

      await Promise.all([promise, clientError]);
    });

    it("should begin timeout only once awaiter is moved to head of queue", async () => {
      vi.useFakeTimers();
      const { client, clientError } = fakeConnection();

      const promise1 = awaitResponse(client, {
        errorType: (message, cause) => new BaseError(message, cause),
        errorMessage: "test awaiter1 failure",
        timeout: 1000,
      });

      const promise2 = awaitResponse(client, {
        errorType: (message, cause) => new BaseError(message, cause),
        errorMessage: "test awaiter2 failure",
        timeout: 1000,
      });

      vi.advanceTimersByTime(1000);

      await assertErrorChain(
        [promise1, clientError],
        BaseError,
        "test awaiter1 failure",
        TimeoutError,
        "Timed out after waiting for response for 1000 milliseconds",
      );

      vi.advanceTimersByTime(1000);
      await assertErrorChain(
        promise2,
        BaseError,
        "test awaiter2 failure",
        TimeoutError,
        "Timed out after waiting for response for 1000 milliseconds",
      );
    });

    it("should notify other awaiters that they are outpaced", async () => {
      const { client, emitAndEnd, clientError } = fakeConnection();

      const promise1 = awaitResponse(client, {
        errorType: (message, cause) => new BaseError(message, cause),
        errorMessage: "test awaiter1 failure",
      });
      const expectedMessage = "PONG :tmi.twitch.tv";

      const promise2 = awaitResponse(client, {
        success: (message) => message.rawSource === expectedMessage,
        errorType: (message, cause) => new BaseError(message, cause),
        errorMessage: "test awaiter2 failure",
      });

      // awaiter2 will resolve -> awaiter1 will be rejected because it was
      // outpaced

      emitAndEnd(expectedMessage);

      await assertErrorChain(
        [promise1, clientError],
        BaseError,
        "test awaiter1 failure",
        TimeoutError,
        "A response to a command issued later than this command was received",
      );

      const matchedMessage = await promise2;
      assert.strictEqual(matchedMessage.rawSource, expectedMessage);
    });
  });
});
