import { SingleConnection } from "../client/connection";

export async function sendPrivmsg(
  conn: SingleConnection,
  channelName: string,
  message: string,
  replyTo?: string
): Promise<void> {
  if (replyTo)
    conn.sendRaw(
      `@reply-parent-msg-id=${replyTo} PRIVMSG #${channelName} :${message}`
    );
  else conn.sendRaw(`PRIVMSG #${channelName} :${message}`);
}
