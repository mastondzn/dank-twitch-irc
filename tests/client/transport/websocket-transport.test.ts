import { ws } from "msw";
import { setupServer } from "msw/node";
import { assert, describe, expect, it } from "vitest";

import type { SingleConnection } from "~/client/connection";
import type { ExpandedWebSocketTransportConfiguration } from "~/config/expanded";
import { ChatClient } from "~/client/client";
import { WebSocketTransport } from "~/client/transport/websocket-transport";
import { ReconnectError } from "~/functionalities/handle-reconnect-message";

const WS_URL = "wss://irc-ws.chat.twitch.tv";
const api = ws.link(WS_URL);

describe.sequential("./client/transport/websocket-transport", () => {
  describe("connect", () => {
    it("should call the connectionListener when the WebSocket opens", async () => {
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

      const opened = new Promise<void>((resolve) => {
        transport.connect(() => resolve());
      });

      await opened;
      transport.stream.destroy();
      server.close();
    });
  });

  describe("receiving", () => {
    it("should push WebSocket messages to the stream", async () => {
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
      transport.connect();

      const chunks: string[] = [];
      transport.stream.on("data", (chunk: string) => {
        chunks.push(chunk);
      });

      await new Promise<void>((resolve) => {
        transport.stream.on("end", () => resolve());
      });

      assert.deepStrictEqual(chunks, ["hello world"]);
      transport.stream.destroy();
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

      const opened = new Promise<void>((resolve) => {
        transport.connect(() => resolve());
      });

      await opened;

      transport.stream.write("PING\r\n");
      transport.stream.resume();

      await new Promise<void>((resolve) => {
        transport.stream.on("end", () => resolve());
      });

      assert.strictEqual(received, "PING\r\n");
      transport.stream.destroy();
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
      transport.stream.write("NICK justinfan12345\r\n");
      transport.stream.write("PASS oauth:test\r\n");

      transport.connect();
      transport.stream.resume();

      await new Promise<void>((resolve) => {
        transport.stream.on("end", () => resolve());
      });

      assert.deepStrictEqual(received, [
        "NICK justinfan12345\r\n",
        "PASS oauth:test\r\n",
      ]);
      transport.stream.destroy();
      server.close();
    });
  });

  describe("close", () => {
    it("should push null to the stream when the WebSocket closes", async () => {
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
      transport.connect();
      transport.stream.resume();

      const ended = new Promise<void>((resolve) => {
        transport.stream.on("end", () => resolve());
      });

      await ended;
      transport.stream.destroy();
      server.close();
    });

    it("should close the WebSocket when the stream is destroyed", async () => {
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

      const opened = new Promise<void>((resolve) => {
        transport.connect(() => resolve());
      });

      await opened;

      transport.stream.destroy();

      // allow close event to propagate through msw
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 50);
      });

      assert.strictEqual(clientClosed, true);
      server.close();
    });

    it("should not throw if the stream is destroyed before connect", () => {
      const config: ExpandedWebSocketTransportConfiguration = {
        type: "websocket",
        url: WS_URL,
        preSetup: false,
      };

      const transport = new WebSocketTransport(config);
      assert.doesNotThrow(() => {
        transport.stream.destroy();
      });
    });
  });

  it("should destroy the stream with an error when the WebSocket errors", async () => {
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
    transport.connect();

    const error = await new Promise<Error>((resolve) => {
      transport.stream.on("error", (err) => resolve(err));
    });

    expect(error.message).toBe("WebSocket error");
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
