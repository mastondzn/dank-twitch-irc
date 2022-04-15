import { awaitResponse } from "../await/await-response";
import { matchingNotice } from "../await/conditions";
import { SingleConnection } from "../client/connection";
import { MessageError } from "../client/errors";
import { validateChannelName } from "../validation/channel";
import { sendPrivmsg } from "./privmsg";

export class MessageDeleteError extends MessageError {
  public channelName: string;
  public messageID: string;

  public constructor(
    channelName: string,
    messageID: string,
    message?: string,
    cause?: Error
  ) {
    super(message, cause);
    this.channelName = channelName;
    this.messageID = messageID;
  }
}

const failureNoticeIDs = [
  "no_permission",
  "bad_delete_message_admin",
  "bad_delete_message_anon",
  "bad_delete_message_broadcaster",
  "bad_delete_message_global_mod",
  "bad_delete_message_mod",
  "bad_delete_message_self",
  "bad_delete_message_staff",
  "usage_delete",
];

const successNoticeIDs = ["delete_message_success", "already_deleted"];

export async function deleteMsg(
  conn: SingleConnection,
  channelName: string,
  messageID: string
): Promise<void> {
  validateChannelName(channelName);

  const cmd = `/delete ${messageID}`;

  await sendPrivmsg(conn, channelName, cmd);

  await awaitResponse(conn, {
    success: matchingNotice(channelName, successNoticeIDs),
    failure: matchingNotice(channelName, failureNoticeIDs),
    errorType: (msg, cause) =>
      new MessageDeleteError(channelName, messageID, msg, cause),
    errorMessage: `Failed to delete ${messageID} in #${channelName}`,
  });
}
