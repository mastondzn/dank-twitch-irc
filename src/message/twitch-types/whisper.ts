import type { TwitchBadgesList } from "../badges";
import type { Color } from "../color";
import type { TwitchEmoteList } from "../emotes";
import type { MessageSender } from "./privmsg";
import {
  IRCMessage,
  requireNickname,
  requireParameter,
} from "../irc/irc-message";
import { parseBadges } from "../parser/badges";
import { tagParserFor } from "../parser/tag-values";

// @badges=;color=#1E90FF;display-name=BotFactory;emotes=;message-id=6134;thread-id=40286300_403015524;turbo=0;
// user-id=403015524;user-type= :botfactory!botfactory@botfactory.tmi.twitch.tv WHISPER randers :Pong
export class WhisperMessage extends IRCMessage {
  private readonly _content: string;
  private readonly _senderLogin: string;
  private readonly _senderId: string;
  private readonly _recipientUsername: string;
  private readonly _badges: TwitchBadgesList;
  private readonly _badgesRaw: string;
  private readonly _color: Color | undefined;
  private readonly _colorRaw: string;
  private readonly _displayName: string;
  private readonly _emotes: TwitchEmoteList;
  private readonly _emotesRaw: string;
  private readonly _id: string;
  private readonly _threadId: string;

  public get content(): string {
    return this._content;
  }

  public get id(): string {
    return this._id;
  }

  public get threadId(): string {
    return this._threadId;
  }

  public get emotes(): TwitchEmoteList {
    return this._emotes;
  }

  public get emotesRaw(): string {
    return this._emotesRaw;
  }

  public get recipientUsername(): string {
    return this._recipientUsername;
  }

  public get sender(): MessageSender {
    const emptyBadgeInfo = parseBadges("");
    return {
      login: this._senderLogin,
      username: this._senderLogin,
      id: this._senderId,
      displayName: this._displayName,
      color: this._color,
      colorRaw: this._colorRaw,
      badgeInfo: emptyBadgeInfo,
      badgeInfoRaw: "",
      badges: this._badges,
      badgesRaw: this._badgesRaw,
      isMod: false,
      isModRaw: "0",
    };
  }

  // ---- Deprecated aliases ----

  /** @deprecated Use {@link content} instead. */
  public get messageText(): string {
    return this._content;
  }

  /** @deprecated Use {@link sender.login} instead. */
  public get senderUsername(): string {
    return this._senderLogin;
  }

  /** @deprecated Use {@link sender.id} instead. */
  public get senderUserID(): string {
    return this._senderId;
  }

  /** @deprecated Use {@link sender.id} instead. */
  public get senderUserId(): string {
    return this._senderId;
  }

  /** @deprecated Use {@link sender.badges} instead. */
  public get badges(): TwitchBadgesList {
    return this._badges;
  }

  /** @deprecated Use {@link sender.badgesRaw} instead. */
  public get badgesRaw(): string {
    return this._badgesRaw;
  }

  /** @deprecated Use {@link sender.color} instead. */
  public get color(): Color | undefined {
    return this._color;
  }

  /** @deprecated Use {@link sender.colorRaw} instead. */
  public get colorRaw(): string {
    return this._colorRaw;
  }

  /** @deprecated Use {@link sender.displayName} instead. */
  public get displayName(): string {
    return this._displayName;
  }

  /** @deprecated Use {@link id} instead. */
  public get messageID(): string {
    return this._id;
  }

  /** @deprecated Use {@link id} instead. */
  public get messageId(): string {
    return this._id;
  }

  /** @deprecated Use {@link threadId} instead. */
  public get threadID(): string {
    return this._threadId;
  }

  public constructor(ircMessage: IRCMessage) {
    super(ircMessage);

    this._content = requireParameter(this, 1);

    this._senderLogin = requireNickname(this);

    const tagParser = tagParserFor(this.ircTags);
    this._senderId = tagParser.requireString("user-id");

    this._recipientUsername = this.ircParameters[0]!;

    this._badges = tagParser.requireBadges("badges");
    this._badgesRaw = tagParser.requireString("badges");
    this._color = tagParser.getColor("color");
    this._colorRaw = tagParser.requireString("color");

    // trim: Twitch workaround for unsanitized data, see https://github.com/robotty/dank-twitch-irc/issues/33
    this._displayName = tagParser.requireString("display-name").trim();
    this._emotes = tagParser.requireEmotes("emotes", this._content);
    this._emotesRaw = tagParser.requireString("emotes");

    this._id = tagParser.requireString("message-id");
    this._threadId = tagParser.requireString("thread-id");
  }
}
