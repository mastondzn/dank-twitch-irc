import { Duplex } from "node:stream";

import { assert, describe, expect, it, vi } from "vitest";

import { DuplexTransport } from "./duplex-transport";
import type { ExpandedDuplexTransportConfiguration } from "../../config/expanded";

describe("./client/transport/duplex-transport", () => {
  describe("duplexTransport", () => {
    it("should call the stream-getter function from the config once", () => {
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
