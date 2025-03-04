import type { SingleConnection } from "~/client/connection";
import { awaitResponse } from "~/await/await-response";
import { ConnectionError } from "~/client/errors";
import { PongMessage } from "~/message/twitch-types/connection/pong";

export class PingTimeoutError extends ConnectionError {}

function randomPingIdentifier(): string {
  const randomHexString = Math.random().toString(16).slice(2, 14);
  return `dank-twitch-irc:manual:${randomHexString}`;
}

export async function sendPing(
  conn: SingleConnection,
  pingIdentifier: string = randomPingIdentifier(),
  timeout = 2000,
): Promise<PongMessage> {
  conn.sendRaw(`PING :${pingIdentifier}`);

  return awaitResponse(conn, {
    success: (message): message is PongMessage =>
      message instanceof PongMessage && message.argument === pingIdentifier,
    timeout,
    errorType: (message, cause) => new PingTimeoutError(message, cause),
    errorMessage: "Server did not PONG back",
  });
}
