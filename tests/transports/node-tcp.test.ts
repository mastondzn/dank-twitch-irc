import { createServer, type AddressInfo } from "node:net";

import { describe, expect, it } from "vitest";

import { createNodeTcpTransport, TcpTransport } from "~/transports/node-tcp";

describe("./transports/node-tcp", () => {
  describe("#createNodeTcpTransport()", () => {
    it("should create a custom transport configuration", () => {
      const config = createNodeTcpTransport({
        secure: false,
        host: "127.0.0.1",
        port: 1234,
      });

      expect(config.type).toBe("custom");

      const transport = config.createTransport();
      expect(transport).toBeInstanceOf(TcpTransport);
      transport.destroy();
    });
  });

  describe("#TcpTransport", () => {
    it("should buffer writes before connect and receive server data", async () => {
      const server = createServer((socket) => {
        socket.write(":tmi.twitch.tv 001 justinfan12345 :Welcome, GLHF!\r\n");
        socket.on("data", (chunk) => socket.write(chunk));
      });

      await new Promise<void>((resolve) => {
        server.listen(0, "127.0.0.1", resolve);
      });

      const address = server.address() as AddressInfo;
      const transport = new TcpTransport({
        secure: false,
        host: "127.0.0.1",
        port: address.port,
      });

      try {
        transport.write("NICK justinfan12345\r\n");

        await transport.connect();

        const reader = transport.readable.getReader();
        const decoder = new TextDecoder();
        let received = "";

        while (!received.includes("NICK justinfan12345\r\n")) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          received +=
            typeof value === "string"
              ? value
              : decoder.decode(value, { stream: true });
        }

        expect(received).toContain("Welcome, GLHF!");
        expect(received).toContain("NICK justinfan12345\r\n");
      } finally {
        transport.destroy();
        await new Promise<void>((resolve) => {
          server.close(() => resolve());
        });
      }
    });
  });
});
