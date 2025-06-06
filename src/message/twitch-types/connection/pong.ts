import {
  type IRCMessageData,
  getParameter,
  IRCMessage,
} from "../../irc/irc-message";

export class PongMessage extends IRCMessage {
  public readonly argument: string | undefined;
  public constructor(message: IRCMessageData) {
    super(message);

    this.argument = getParameter(this, 1);
  }
}
