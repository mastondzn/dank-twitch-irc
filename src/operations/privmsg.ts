import type { SingleConnection } from "~/client/connection";

// eslint-disable-next-line ts/require-await
export async function sendPrivmsg(
  conn: SingleConnection,
  channelName: string,
  message: string,
  replyTo?: string,
): Promise<void> {
  conn.sendRaw(
    replyTo
      ? `@reply-parent-msg-id=${replyTo} PRIVMSG #${channelName} :${message}`
      : `PRIVMSG #${channelName} :${message}`,
  );
}
