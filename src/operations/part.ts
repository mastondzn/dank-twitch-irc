import type { SingleConnection } from "~/client/connection";
import { awaitResponse } from "~/await/await-response";
import { MessageError } from "~/client/errors";
import { PartMessage } from "~/message/twitch-types/membership/part";

export class PartError extends MessageError {
  public failedChannelName: string;

  public constructor(
    failedChannelName: string,
    message: string,
    cause?: Error,
  ) {
    super(message, cause);
    this.failedChannelName = failedChannelName;
  }
}

export async function awaitPartResponse(
  conn: SingleConnection,
  channelName: string,
): Promise<PartMessage> {
  return awaitResponse(conn, {
    // :justinfan12345!justinfan12345@justinfan12345.tmi.twitch.tv PART #pajlada
    success: (message): message is PartMessage =>
      message instanceof PartMessage &&
      message.channelName === channelName &&
      message.partedUsername === conn.configuration.username,
    errorType: (message, cause) => new PartError(channelName, message, cause),
    errorMessage: `Failed to part channel ${channelName}`,
  });
}

export function partNothingToDo(
  conn: SingleConnection,
  channelName: string,
): boolean {
  return (
    !conn.wantedChannels.has(channelName) &&
    !conn.joinedChannels.has(channelName)
  );
}

export async function partChannel(
  conn: SingleConnection,
  channelName: string,
): Promise<PartMessage | undefined> {
  if (partNothingToDo(conn, channelName)) {
    // nothing to do (already parted)
    return;
  }

  conn.sendRaw(`PART #${channelName}`);

  conn.wantedChannels.delete(channelName);
  const response = await awaitPartResponse(conn, channelName);
  conn.joinedChannels.delete(channelName);
  return response;
}
