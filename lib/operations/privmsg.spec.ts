import { assert, describe, it } from "vitest";

import { sendPrivmsg } from "./privmsg";
import { fakeConnection } from "../utils/helpers.spec";

describe("./operations/privmsg", () => {
  describe("#sendPrivmsg()", () => {
    it("should send the correct wire command", () => {
      const { client, data } = fakeConnection();

      void sendPrivmsg(client, "forsen", "Kappa Keepo PogChamp");

      assert.deepStrictEqual(data, [
        "PRIVMSG #forsen :Kappa Keepo PogChamp\r\n",
      ]);
    });
  });
});
