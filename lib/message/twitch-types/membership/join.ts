import { ChannelIRCMessage } from "../../irc/channel-irc-message";
import { type IRCMessageData, requireNickname } from "../../irc/irc-message";

export class JoinMessage extends ChannelIRCMessage {
  public readonly joinedUsername: string;

  public constructor(message: IRCMessageData) {
    super(message);
    this.joinedUsername = requireNickname(this);
  }
}
