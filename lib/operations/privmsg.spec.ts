import { assert } from "chai";
import { fakeConnection } from "../utils/testing";
import { sendPrivmsg } from "./privmsg";
import { describe, it } from "vitest";

describe("./operations/privmsg", function () {
  describe("#sendPrivmsg()", function () {
    it("should send the correct wire command", function () {
      const { client, data } = fakeConnection();

      sendPrivmsg(client, "forsen", "Kappa Keepo PogChamp");

      assert.deepStrictEqual(data, [
        "PRIVMSG #forsen :Kappa Keepo PogChamp\r\n",
      ]);
    });
  });
});
