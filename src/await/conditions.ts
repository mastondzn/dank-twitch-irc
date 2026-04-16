import type { IRCMessage } from "~/message/irc/irc-message";
import { NoticeMessage } from "~/message/twitch-types/notice";

export function matchingNotice(
  channelName: string,
  noticeIds: string[],
): (message: IRCMessage) => boolean {
  return (message: IRCMessage) => {
    return (
      message instanceof NoticeMessage &&
      message.channel?.login === channelName &&
      noticeIds.includes(message.id!)
    );
  };
}
