import { assert, describe, expect, it, vi } from "vitest";

import type { Transport } from "~/client/transport/transport";
import type { ExpandedCustomTransportConfiguration } from "~/config/expanded";
import { CustomTransport } from "~/client/transport/custom-transport";

function fakeTransport(): Transport {
  return {
    readable: new ReadableStream<Uint8Array | string>(),
    connect: vi.fn().mockResolvedValue(undefined),
    write: vi.fn(),
    destroy: vi.fn(),
  };
}

describe("./client/transport/custom-transport", () => {
  describe("#CustomTransport", () => {
    it("should call the transport factory from the config once", () => {
      const inner = fakeTransport();

      const createTransport = vi.fn(() => inner);
      const config: ExpandedCustomTransportConfiguration = {
        type: "custom",
        createTransport,
        preSetup: false,
      };

      const transport = new CustomTransport(config);

      expect(createTransport).toHaveBeenCalledOnce();
      assert.strictEqual(transport.readable, inner.readable);
    });

    it("should delegate connect, write and destroy to the inner transport", async () => {
      const inner = fakeTransport();
      const config: ExpandedCustomTransportConfiguration = {
        type: "custom",
        createTransport: () => inner,
        preSetup: false,
      };

      const transport = new CustomTransport(config);

      await transport.connect();
      transport.write("PING\r\n");
      const error = new Error("test error");
      transport.destroy(error);

      expect(inner.connect).toHaveBeenCalledWith();
      expect(inner.write).toHaveBeenCalledWith("PING\r\n");
      expect(inner.destroy).toHaveBeenCalledWith(error);
    });
  });
});
