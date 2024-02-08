import { Duplex } from "stream";
import { ExpandedDuplexTransportConfiguration } from "../../config/expanded";
import { DuplexTransport } from "./duplex-transport";
import { assert, describe, expect, it, vi } from "vitest";

describe("./client/transport/duplex-transport", function () {
  describe("DuplexTransport", function () {
    it("should call the stream-getter function from the config once", function () {
      const stream = new Duplex();

      const streamGetter = vi.fn(() => stream);
      const config: ExpandedDuplexTransportConfiguration = {
        type: "duplex",
        stream: streamGetter,
        preSetup: false,
      };

      const transport = new DuplexTransport(config);

      expect(streamGetter).toHaveBeenCalledOnce();
      assert.strictEqual(transport.stream, stream);
    });
  });
});
