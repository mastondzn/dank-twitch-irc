import { ChannelIRCMessage } from "../irc/channel-irc-message";
import { type IRCMessageData, getParameter } from "../irc/irc-message";
import { tagParserFor } from "../parser/tag-values";

export interface ClearchatTarget {
  readonly login: string | undefined;
}

export class ClearchatMessage extends ChannelIRCMessage {
  private readonly _targetLogin: string | undefined;
  private readonly _banDuration: number | undefined;

  public get target(): ClearchatTarget {
    return {
      login: this._targetLogin,
    };
  }

  /**
   * length in seconds (integer), undefined if permanent ban
   */
  public get banDuration(): number | undefined {
    return this._banDuration;
  }

  // ---- Deprecated aliases ----

  /** @deprecated Use {@link target.login} instead. */
  public get targetUsername(): string | undefined {
    return this._targetLogin;
  }

  public constructor(message: IRCMessageData) {
    super(message);

    const tagParser = tagParserFor(this.ircTags);
    this._targetLogin = getParameter(this, 1);
    this._banDuration = tagParser.getInt("ban-duration");
  }

  public wasChatCleared(): this is ClearChatClearchatMessage {
    return this._targetLogin == null && this._banDuration == null;
  }

  public isTimeout(): this is TimeoutClearchatMessage {
    return this._targetLogin != null && this._banDuration != null;
  }

  public isPermaban(): this is PermabanClearchatMessage {
    return this._targetLogin != null && this._banDuration == null;
  }
}

export interface ClearChatClearchatMessage extends ClearchatMessage {
  target: ClearchatTarget & { login: undefined };
  banDuration: undefined;
}

export interface TimeoutClearchatMessage extends ClearchatMessage {
  target: ClearchatTarget & { login: string };
  banDuration: number;
}

export interface PermabanClearchatMessage extends ClearchatMessage {
  target: ClearchatTarget & { login: string };
  banDuration: undefined;
}
