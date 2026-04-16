import { getIRCChannelName, type Channel } from "../irc/channel-irc-message";
import {
  type IRCMessageData,
  IRCMessage,
  requireParameter,
} from "../irc/irc-message";
import { tagParserFor } from "../parser/tag-values";

export class NoticeMessage extends IRCMessage {
  private readonly _channelLogin: string | undefined;
  private readonly _content: string;
  private readonly _id: string | undefined;

  public get channel(): Channel | undefined {
    if (this._channelLogin == null) return undefined;
    return {
      login: this._channelLogin,
      username: this._channelLogin,
    };
  }

  public get content(): string {
    return this._content;
  }

  public get id(): string | undefined {
    return this._id;
  }

  // ---- Deprecated aliases ----

  /** @deprecated Use {@link channel?.login} instead. */
  public get channelName(): string | undefined {
    return this._channelLogin;
  }

  /** @deprecated Use {@link content} instead. */
  public get messageText(): string {
    return this._content;
  }

  /** @deprecated Use {@link id} instead. */
  public get messageID(): string | undefined {
    return this._id;
  }

  /** @deprecated Use {@link id} instead. */
  public get messageId(): string | undefined {
    return this._id;
  }

  public constructor(message: IRCMessageData) {
    super(message);

    // optional = true
    // so we can parse messages like :tmi.twitch.tv NOTICE * :Improperly formatted auth
    // that don't have a valid channel name
    this._channelLogin = getIRCChannelName(this, true);

    const tagParser = tagParserFor(this.ircTags);
    this._content = requireParameter(this, 1);
    this._id = tagParser.getString("msg-id");
  }
}
