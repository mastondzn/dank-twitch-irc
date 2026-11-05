import type { SingleConnection } from "~/client/connection";

export function replyToServerPing(conn: SingleConnection): void {
  conn.on("PING", (message) => {
    conn.sendRaw(
      message.argument == null ? "PONG" : `PONG :${message.argument}`,
    );
  });
}
