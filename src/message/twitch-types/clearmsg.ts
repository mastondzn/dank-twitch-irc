import { ChannelIRCMessage } from "../irc/channel-irc-message";
import { type IRCMessageData, requireParameter } from "../irc/irc-message";
import { tagParserFor } from "../parser/tag-values";

export interface ClearmsgTarget {
  readonly login: string;
  readonly messageId: string;
  readonly content: string;
}

export class ClearmsgMessage extends ChannelIRCMessage {
  private readonly _targetLogin: string;
  private readonly _targetMessageId: string;
  private readonly _targetMessageContent: string;

  public get target(): ClearmsgTarget {
    return {
      login: this._targetLogin,
      messageId: this._targetMessageId,
      content: this._targetMessageContent,
    };
  }

  // ---- Deprecated aliases ----

  /** @deprecated Use {@link target.login} instead. */
  public get targetUsername(): string {
    return this._targetLogin;
  }

  /** @deprecated Use {@link target.messageId} instead. */
  public get targetMessageID(): string {
    return this._targetMessageId;
  }

  /** @deprecated Use {@link target.messageId} instead. */
  public get targetMessageId(): string {
    return this._targetMessageId;
  }

  /** @deprecated Use {@link target.content} instead. */
  public get targetMessageContent(): string {
    return this._targetMessageContent;
  }

  public constructor(message: IRCMessageData) {
    super(message);

    const tagParser = tagParserFor(this.ircTags);
    this._targetLogin = tagParser.requireString("login");
    this._targetMessageId = tagParser.requireString("target-msg-id");
    this._targetMessageContent = requireParameter(this, 1);
  }
}
