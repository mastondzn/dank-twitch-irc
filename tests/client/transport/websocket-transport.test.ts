import { ws } from "msw";
import { setupServer } from "msw/node";
import { assert, describe, expect, it, vi } from "vitest";

import type { SingleConnection } from "~/client/connection";
import type { ExpandedWebSocketTransportConfiguration } from "~/config/expanded";
import { ChatClient } from "~/client/client";
import { WebSocketTransport } from "~/client/transport/websocket-transport";
import { ReconnectError } from "~/functionalities/handle-reconnect-message";

const WS_URL = "wss://irc-ws.chat.twitch.tv";
const api = ws.link(WS_URL);

async function readAll(transport: WebSocketTransport): Promise<string> {
  const reader = transport.readable.getReader();
  const decoder = new TextDecoder();
  let result = "";

  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      return result;
    }

    result +=
      typeof value === "string"
        ? value
        : decoder.decode(value, { stream: true });
  }
}

describe.sequential("./client/transport/websocket-transport", () => {
  describe("connect", () => {
    it("should resolve when the WebSocket opens", async () => {
      const server = setupServer(
        api.addEventListener("connection", ({ client }) => {
          setTimeout(() => client.close(), 10);
        }),
      );
      server.listen();

      const config: ExpandedWebSocketTransportConfiguration = {
        type: "websocket",
        url: WS_URL,
        preSetup: false,
      };

      const transport = new WebSocketTransport(config);

      await transport.connect();
      transport.destroy();
      server.close();
    });
  });

  describe("receiving", () => {
    it("should push WebSocket messages to the readable stream", async () => {
      const server = setupServer(
        api.addEventListener("connection", ({ client }) => {
          setTimeout(() => {
            client.send("hello world");
            setTimeout(() => client.close(), 10);
          }, 10);
        }),
      );
      server.listen();

      const config: ExpandedWebSocketTransportConfiguration = {
        type: "websocket",
        url: WS_URL,
        preSetup: false,
      };

      const transport = new WebSocketTransport(config);
      await transport.connect();

      const received = await readAll(transport);

      assert.strictEqual(received, "hello world");
      transport.destroy();
      server.close();
    });
  });

  describe("sending", () => {
    it("should send writes to the WebSocket", async () => {
      let received: string | undefined;

      const server = setupServer(
        api.addEventListener("connection", ({ client }) => {
          client.addEventListener("message", (event: MessageEvent) => {
            received = event.data as string;
          });

          setTimeout(() => client.close(), 10);
        }),
      );
      server.listen();

      const config: ExpandedWebSocketTransportConfiguration = {
        type: "websocket",
        url: WS_URL,
        preSetup: false,
      };

      const transport = new WebSocketTransport(config);

      await transport.connect();

      const ended = readAll(transport);
      transport.write("PING\r\n");

      await ended;

      assert.strictEqual(received, "PING\r\n");
      transport.destroy();
      server.close();
    });

    it("should buffer writes before the WebSocket opens and flush them on open", async () => {
      const received: string[] = [];

      const server = setupServer(
        api.addEventListener("connection", ({ client }) => {
          client.addEventListener("message", (event: MessageEvent) => {
            received.push(event.data as string);
          });

          setTimeout(() => client.close(), 10);
        }),
      );
      server.listen();

      const config: ExpandedWebSocketTransportConfiguration = {
        type: "websocket",
        url: WS_URL,
        preSetup: false,
      };

      const transport = new WebSocketTransport(config);

      // write before connect
      transport.write("NICK justinfan12345\r\n");
      transport.write("PASS oauth:test\r\n");

      const ended = readAll(transport);
      await transport.connect();

      await ended;

      assert.deepStrictEqual(received, [
        "NICK justinfan12345\r\n",
        "PASS oauth:test\r\n",
      ]);
      transport.destroy();
      server.close();
    });
  });

  describe("close", () => {
    it("should close the readable stream when the WebSocket closes", async () => {
      const server = setupServer(
        api.addEventListener("connection", ({ client }) => {
          setTimeout(() => client.close(), 10);
        }),
      );
      server.listen();

      const config: ExpandedWebSocketTransportConfiguration = {
        type: "websocket",
        url: WS_URL,
        preSetup: false,
      };

      const transport = new WebSocketTransport(config);
      await transport.connect();

      await readAll(transport);

      transport.destroy();
      server.close();
    });

    it("should close the WebSocket when the transport is destroyed", async () => {
      let clientClosed = false;

      const server = setupServer(
        api.addEventListener("connection", ({ client }) => {
          client.addEventListener("close", () => {
            clientClosed = true;
          });
        }),
      );
      server.listen();

      const config: ExpandedWebSocketTransportConfiguration = {
        type: "websocket",
        url: WS_URL,
        preSetup: false,
      };

      const transport = new WebSocketTransport(config);

      await transport.connect();

      transport.destroy();

      // allow close event to propagate through msw
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 50);
      });

      assert.strictEqual(clientClosed, true);
      server.close();
    });

    it("should not throw if the transport is destroyed before connect", () => {
      const config: ExpandedWebSocketTransportConfiguration = {
        type: "websocket",
        url: WS_URL,
        preSetup: false,
      };

      const transport = new WebSocketTransport(config);
      assert.doesNotThrow(() => {
        transport.destroy();
      });
    });

    it("should reject connect if the transport is already closed", async () => {
      const config: ExpandedWebSocketTransportConfiguration = {
        type: "websocket",
        url: WS_URL,
        preSetup: false,
      };

      const transport = new WebSocketTransport(config);
      transport.destroy();

      await expect(transport.connect()).rejects.toThrow("Transport is closed");
    });
  });

  it("should reject connect when the WebSocket errors before opening", async () => {
    class FailingWebSocket extends EventTarget {
      public static instance: FailingWebSocket;

      public binaryType = "blob";
      public readyState = 0;

      public constructor() {
        super();
        FailingWebSocket.instance = this;
      }

      public send(): void {
        // no-op
      }

      public close(): void {
        // no-op
      }
    }

    vi.stubGlobal("WebSocket", FailingWebSocket);

    const config: ExpandedWebSocketTransportConfiguration = {
      type: "websocket",
      url: WS_URL,
      preSetup: false,
    };

    const transport = new WebSocketTransport(config);
    const connected = transport.connect();

    FailingWebSocket.instance.dispatchEvent(new Event("error"));

    await expect(connected).rejects.toThrow("WebSocket error");

    transport.destroy();
    vi.unstubAllGlobals();
  });

  it("should error the readable stream when the WebSocket errors", async () => {
    const server = setupServer(
      api.addEventListener("connection", ({ client }) => {
        setTimeout(() => {
          const errorEvent = new Event("error");
          const clientSocket = (client as unknown as { socket: EventTarget })
            .socket;
          clientSocket.dispatchEvent(errorEvent);
        }, 10);
      }),
    );
    server.listen();

    const config: ExpandedWebSocketTransportConfiguration = {
      type: "websocket",
      url: WS_URL,
      preSetup: false,
    };

    const transport = new WebSocketTransport(config);
    await transport.connect();

    const reader = transport.readable.getReader();
    let result: unknown;
    try {
      result = await reader.read();
    } catch (error) {
      result = error;
    }

    assert.instanceOf(result, Error);
    expect(result.message).toBe("WebSocket error");
    server.close();
  });

  it("should emit reconnect event and replace connection when server sends RECONNECT", async () => {
    const server = setupServer(
      api.addEventListener("connection", ({ client }) => {
        client.addEventListener("message", (event: MessageEvent) => {
          const message = event.data as string;
          if (message.startsWith("CAP REQ")) {
            client.send(
              ":tmi.twitch.tv CAP * ACK :twitch.tv/commands twitch.tv/tags\r\n",
            );
          } else if (message.startsWith("NICK")) {
            client.send(
              ":tmi.twitch.tv 001 justinfan12345 :Welcome, GLHF!\r\n",
            );
            setTimeout(() => {
              client.send(":tmi.twitch.tv RECONNECT\r\n");
            }, 50);
          }
        });
      }),
    );
    server.listen();

    const client = new ChatClient({
      connection: {
        type: "websocket",
        url: WS_URL,
      },
      installDefaultMixins: false,
    });

    const reconnectPromise = new Promise<SingleConnection>((resolve) => {
      client.once("reconnect", (conn) => resolve(conn));
    });

    const errorPromise = new Promise<Error>((resolve) => {
      client.once("error", (error) => resolve(error));
    });

    await client.connect();

    const reconnectConn = await reconnectPromise;
    const error = await errorPromise;

    assert.instanceOf(error, ReconnectError);

    assert.strictEqual(
      client.connections.includes(reconnectConn),
      false,
      "old connection should be removed",
    );
    assert.strictEqual(
      client.connections.length >= 1,
      true,
      "a new connection should exist",
    );

    client.destroy();
    server.close();
  });
});
