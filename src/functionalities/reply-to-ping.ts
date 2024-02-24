import type { SingleConnection } from "../client/connection";

export function replyToServerPing(conn: SingleConnection): void {
  conn.on("PING", (message) => {
    if (message.argument == null) {
      conn.sendRaw("PONG");
    } else {
      conn.sendRaw(`PONG :${message.argument}`);
    }
  });
}
