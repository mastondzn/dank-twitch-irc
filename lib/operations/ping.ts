import { randomBytes } from "node:crypto";

import { awaitResponse } from "../await/await-response";
import type { SingleConnection } from "../client/connection";
import { ConnectionError } from "../client/errors";
import { PongMessage } from "../message/twitch-types/connection/pong";

export class PingTimeoutError extends ConnectionError {}

function randomPingIdentifier(): string {
  const randomHexString = randomBytes(16).toString("hex").toLowerCase();
  return `dank-twitch-irc:manual:${randomHexString}`;
}

export async function sendPing(
  conn: SingleConnection,
  pingIdentifier: string = randomPingIdentifier(),
  timeout = 2000,
): Promise<PongMessage> {
  conn.sendRaw(`PING :${pingIdentifier}`);

  return (await awaitResponse(conn, {
    success: (message) =>
      message instanceof PongMessage && message.argument === pingIdentifier,
    timeout,
    errorType: (message, cause) => new PingTimeoutError(message, cause),
    errorMessage: "Server did not PONG back",
  })) as PongMessage;
}
