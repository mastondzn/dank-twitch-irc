import type {
  IRCMessageData} from "../../irc/irc-message";
import {
  IRCMessage,
  getParameter
} from "../../irc/irc-message";

export class PingMessage extends IRCMessage {
  public readonly argument: string | undefined;
  public constructor(message: IRCMessageData) {
    super(message);

    this.argument = getParameter(this, 1);
  }
}
