import { assert, describe, expect, it, vi } from "vitest";

import type { Transport } from "~/client/transport/transport";
import type { ExpandedCustomTransportConfiguration } from "~/config/expanded";
import { CustomTransport } from "~/client/transport/custom-transport";

function fakeTransport(): Transport {
  return {
    readable: new ReadableStream<Uint8Array | string>(),
    connect: vi.fn(),
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

    it("should delegate connect, write and destroy to the inner transport", () => {
      const inner = fakeTransport();
      const config: ExpandedCustomTransportConfiguration = {
        type: "custom",
        createTransport: () => inner,
        preSetup: false,
      };

      const transport = new CustomTransport(config);
      const connectionListener = vi.fn();

      transport.connect(connectionListener);
      transport.write("PING\r\n");
      const error = new Error("test error");
      transport.destroy(error);

      expect(inner.connect).toHaveBeenCalledWith(connectionListener);
      expect(inner.write).toHaveBeenCalledWith("PING\r\n");
      expect(inner.destroy).toHaveBeenCalledWith(error);
    });
  });
});
