import { afterEach, describe, expect, it } from "vitest";

import { createBunTcpTransport, BunTcpTransport } from "~/transports/bun-tcp";

interface FakeSocket {
  chunks: Uint8Array[];
  closed: boolean;
  ended: boolean;
  write: (data: Uint8Array) => number;
  end: () => void;
  close: () => void;
}

interface FakeHandlers {
  data: (socket: FakeSocket, data: Uint8Array) => void;
  close: (socket: FakeSocket, error?: Error) => void;
  error: (socket: FakeSocket, error: Error) => void;
  end: (socket: FakeSocket) => void;
  drain: (socket: FakeSocket) => void;
  connectError: (socket: FakeSocket, error: Error) => void;
  timeout: (socket: FakeSocket) => void;
}

interface FakeConnectOptions {
  hostname: string;
  port: number;
  tls: boolean;
  socket: FakeHandlers;
}

interface FakeRuntime {
  options: FakeConnectOptions | undefined;
  socket: FakeSocket;
  handlers: FakeHandlers | undefined;
  connect: (options: FakeConnectOptions) => Promise<FakeSocket>;
}

const bunGlobal = globalThis as { Bun?: unknown };
const originalBun = bunGlobal.Bun;

afterEach(() => {
  if (originalBun === undefined) {
    delete bunGlobal.Bun;
  } else {
    bunGlobal.Bun = originalBun;
  }
});

function createFakeRuntime(writeLimit = Infinity): FakeRuntime {
  const socket: FakeSocket = {
    chunks: [],
    closed: false,
    ended: false,
    write(data) {
      const written = Math.min(data.byteLength, writeLimit);
      socket.chunks.push(data.slice(0, written));
      return written;
    },
    end() {
      socket.ended = true;
    },
    close() {
      socket.closed = true;
    },
  };

  const runtime: FakeRuntime = {
    options: undefined,
    socket,
    handlers: undefined,
    async connect(options) {
      runtime.options = options;
      runtime.handlers = options.socket;
      await Promise.resolve();
      return socket;
    },
  };

  return runtime;
}

function handlersOf(runtime: FakeRuntime): FakeHandlers {
  if (runtime.handlers == null) {
    throw new Error("Bun.connect was not called");
  }

  return runtime.handlers;
}

function writtenText(socket: FakeSocket): string {
  const length = socket.chunks.reduce(
    (total, chunk) => total + chunk.byteLength,
    0,
  );
  const bytes = new Uint8Array(length);
  let offset = 0;

  for (const chunk of socket.chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new TextDecoder().decode(bytes);
}

describe("./transports/bun-tcp", () => {
  describe("#createBunTcpTransport()", () => {
    it("should create a custom transport configuration", () => {
      const config = createBunTcpTransport({
        secure: false,
        host: "127.0.0.1",
        port: 1234,
      });

      expect(config.type).toBe("custom");

      const transport = config.createTransport();
      expect(transport).toBeInstanceOf(BunTcpTransport);
      transport.destroy();
    });
  });

  describe("#BunTcpTransport", () => {
    it("should use Twitch TLS defaults", async () => {
      const runtime = createFakeRuntime();
      bunGlobal.Bun = runtime;

      const transport = new BunTcpTransport();

      try {
        await transport.connect();

        expect(runtime.options).toMatchObject({
          hostname: "irc.chat.twitch.tv",
          port: 6697,
          tls: true,
        });
      } finally {
        transport.destroy();
      }
    });

    it("should buffer writes before connect and receive server data", async () => {
      const runtime = createFakeRuntime();
      bunGlobal.Bun = runtime;

      const transport = new BunTcpTransport({
        secure: false,
        host: "127.0.0.1",
        port: 6667,
      });

      try {
        transport.write("");
        transport.write("NICK justinfan12345\r\n");
        expect(runtime.socket.chunks).toHaveLength(0);

        await transport.connect();

        expect(runtime.options).toMatchObject({
          hostname: "127.0.0.1",
          port: 6667,
          tls: false,
        });
        expect(writtenText(runtime.socket)).toBe("NICK justinfan12345\r\n");

        const reader = transport.readable.getReader();
        handlersOf(runtime).data(
          runtime.socket,
          new TextEncoder().encode(
            ":tmi.twitch.tv 001 justinfan12345 :Welcome, GLHF!\r\n",
          ),
        );

        const { value } = await reader.read();
        expect(new TextDecoder().decode(value as Uint8Array)).toContain(
          "Welcome, GLHF!",
        );
      } finally {
        transport.destroy();
      }

      expect(runtime.socket.closed).toBe(true);
    });

    it("should flush partially written chunks on drain", async () => {
      const runtime = createFakeRuntime(4);
      bunGlobal.Bun = runtime;

      const transport = new BunTcpTransport({ secure: false });

      try {
        transport.write("NICK\r\n");
        await transport.connect();

        expect(writtenText(runtime.socket)).toBe("NICK");

        handlersOf(runtime).drain(runtime.socket);

        expect(writtenText(runtime.socket)).toBe("NICK\r\n");
      } finally {
        transport.destroy();
      }
    });

    it("should error the readable stream on socket errors", async () => {
      const runtime = createFakeRuntime();
      bunGlobal.Bun = runtime;

      const transport = new BunTcpTransport({ secure: false });
      const reader = transport.readable.getReader();

      try {
        await transport.connect();

        const reading = reader.read();
        handlersOf(runtime).error(runtime.socket, new Error("socket failed"));

        await expect(reading).rejects.toThrow("socket failed");
      } finally {
        transport.destroy();
      }
    });

    it("should close the readable stream when the server ends the connection", async () => {
      const runtime = createFakeRuntime();
      bunGlobal.Bun = runtime;

      const transport = new BunTcpTransport({ secure: false });
      const reader = transport.readable.getReader();

      try {
        await transport.connect();

        const reading = reader.read();
        handlersOf(runtime).end(runtime.socket);

        await expect(reading).resolves.toEqual({
          done: true,
          value: undefined,
        });
      } finally {
        transport.destroy();
      }
    });

    it("should reject connect when the connection fails", async () => {
      const runtime = createFakeRuntime();
      runtime.connect = async (options) => {
        runtime.options = options;
        runtime.handlers = options.socket;

        const error = new Error("ECONNREFUSED");
        options.socket.connectError(runtime.socket, error);
        await Promise.resolve();
        throw error;
      };
      bunGlobal.Bun = runtime;

      const transport = new BunTcpTransport();
      const reader = transport.readable.getReader();
      const reading = reader.read();

      await expect(transport.connect()).rejects.toThrow("ECONNREFUSED");
      await expect(reading).rejects.toThrow("ECONNREFUSED");

      transport.destroy();
    });

    it("should reject with a helpful error outside the Bun runtime", async () => {
      delete bunGlobal.Bun;

      const transport = new BunTcpTransport();
      const reader = transport.readable.getReader();
      const reading = reader.read();

      await expect(transport.connect()).rejects.toThrow(
        "requires the Bun runtime",
      );
      await expect(reading).rejects.toThrow("requires the Bun runtime");

      transport.destroy();
    });
  });
});
