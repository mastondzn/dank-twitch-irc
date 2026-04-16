import type { TwitchBadgesList } from "../badges";
import type { Color } from "../color";
import type { TwitchEmoteList } from "../emotes";
import type { TwitchFlagList } from "../flags";
import type { SharedChatFields, SharedChatSource } from "../shared-chat";
import type { UserState } from "./userstate";
import { ChannelIRCMessage, type Channel } from "../irc/channel-irc-message";
import {
  type IRCMessage,
  requireNickname,
  requireParameter,
} from "../irc/irc-message";
import { tagParserFor } from "../parser/tag-values";

// eslint-disable-next-line no-control-regex
const actionRegex = /^\u0001ACTION (.*)\u0001$/;

export function parseActionAndMessage(trailingParameter: string): {
  isAction: boolean;
  message: string;
} {
  const match: RegExpExecArray | null = actionRegex.exec(trailingParameter);
  return match == null
    ? {
        isAction: false,
        message: trailingParameter,
      }
    : {
        isAction: true,
        message: match[1]!,
      };
}

export interface MessageSender {
  readonly login: string;
  /** @deprecated Use {@link MessageSender.login} instead. */
  readonly username: string;
  readonly id: string;
  readonly displayName: string;
  readonly color: Color | undefined;
  readonly colorRaw: string;
  readonly badgeInfo: TwitchBadgesList;
  readonly badgeInfoRaw: string;
  readonly badges: TwitchBadgesList;
  readonly badgesRaw: string;
  readonly isMod: boolean;
  readonly isModRaw: string;
}

export interface ReplyParent {
  readonly displayName: string;
  readonly messageBody: string;
  readonly messageId: string;
  readonly userId: string;
  readonly userLogin: string;
}

interface CheerPrivmsgMessage extends PrivmsgMessage {
  readonly bits: number;
  readonly bitsRaw: string;
}

interface ReplyPrivmsgMessage extends PrivmsgMessage {
  readonly replyParent: ReplyParent;
}

/**
 * Omits `emoteSets` and `emoteSetsRaw` from {@link UserState} (because they are not sent
 * for `PRIVMSG` messages)
 * @deprecated Use {@link PrivmsgMessage.sender} instead.
 */
export type PrivmsgUserState = Omit<UserState, "emoteSets" | "emoteSetsRaw">;

export class PrivmsgMessage
  extends ChannelIRCMessage
  // eslint-disable-next-line ts/no-deprecated
  implements PrivmsgUserState, Partial<SharedChatFields>
{
  private readonly _content: string;
  private readonly _action: boolean;
  private readonly _senderLogin: string;
  private readonly _senderId: string;
  private readonly _badgeInfo: TwitchBadgesList;
  private readonly _badgeInfoRaw: string;
  private readonly _badges: TwitchBadgesList;
  private readonly _badgesRaw: string;
  private readonly _bits: number | undefined;
  private readonly _bitsRaw: string | undefined;
  private readonly _color: Color | undefined;
  private readonly _colorRaw: string;
  private readonly _displayName: string;
  private readonly _emotes: TwitchEmoteList;
  private readonly _emotesRaw: string;
  private readonly _flags: TwitchFlagList | undefined;
  private readonly _flagsRaw: string | undefined;
  private readonly _replyParentDisplayName: string | undefined;
  private readonly _replyParentMessageBody: string | undefined;
  private readonly _replyParentMessageId: string | undefined;
  private readonly _replyParentUserId: string | undefined;
  private readonly _replyParentUserLogin: string | undefined;
  private readonly _id: string;
  private readonly _isMod: boolean;
  private readonly _isModRaw: string;
  private readonly _channelRoomId: string;
  private readonly _timestamp: Date;
  private readonly _timestampRaw: string;
  private readonly _sourceId: string | undefined;
  private readonly _sourceChannelId: string | undefined;
  private readonly _sourceBadges: TwitchBadgesList | undefined;
  private readonly _sourceBadgesRaw: string | undefined;
  private readonly _sourceBadgeInfo: TwitchBadgesList | undefined;
  private readonly _sourceBadgeInfoRaw: string | undefined;

  public get isAction(): boolean {
    return this._action;
  }

  public get content(): string {
    return this._content;
  }

  /**
   * The id of the message.
   * @example "7eb848c9-1060-4e5e-9f4c-612877982e79"
   */
  public get id(): string {
    return this._id;
  }

  /**
   * The timestamp of when the message was sent, as reported by Twitch.
   * This is not necessarily the same as the time the message was received by your client.
   */
  public get timestamp(): Date {
    return this._timestamp;
  }

  public get timestampRaw(): string {
    return this._timestampRaw;
  }

  public get bits(): number | undefined {
    return this._bits;
  }

  public get bitsRaw(): string | undefined {
    return this._bitsRaw;
  }

  public get emotes(): TwitchEmoteList {
    return this._emotes;
  }

  public get emotesRaw(): string {
    return this._emotesRaw;
  }

  /**
   * Can be an array of Twitch AutoMod flagged words, for use in moderation and/or filtering purposes.
   *
   * If the `flags` tag is missing or of a unparseable format, this will be `undefined`. This is unlike most other
   * attributes which when missing or malformed will fail the message parsing. However since this attribute is
   * completely undocumented we cannot rely on the `flags` tag being stable, so this soft fallback is used instead.
   * While it will be a major version release if this attribute changes format in dank-twitch-irc, using this is still
   * at your own risk since it may suddenly contain unexpected data or turn `undefined` one day as
   * Twitch changes something. In short: **Use at your own risk** and make sure your
   * implementation can handle the case where this is `undefined`.
   */
  public get flags(): TwitchFlagList | undefined {
    return this._flags;
  }

  /**
   * Twitch AutoMod raw flags string.
   *
   * If the `flags` tag is missing or of a unparseable format, this will be `undefined`. This is unlike most other
   * attributes which when missing or malformed will fail the message parsing. However since this attribute is
   * completely undocumented we cannot rely on the `flags` tag being stable, so this soft fallback is used instead.
   * In short, ensure your implementation can handle the case where this is `undefined` or is in
   * a format you don't expect.
   */
  public get flagsRaw(): string | undefined {
    return this._flagsRaw;
  }

  public override get channel(): Channel & { readonly id: string } {
    return {
      login: this._channelLogin,
      username: this._channelLogin,
      id: this._channelRoomId,
    };
  }

  public get sender(): MessageSender {
    return {
      login: this._senderLogin,
      username: this._senderLogin,
      id: this._senderId,
      displayName: this._displayName,
      color: this._color,
      colorRaw: this._colorRaw,
      badgeInfo: this._badgeInfo,
      badgeInfoRaw: this._badgeInfoRaw,
      badges: this._badges,
      badgesRaw: this._badgesRaw,
      isMod: this._isMod,
      isModRaw: this._isModRaw,
    };
  }

  public get replyParent(): ReplyParent | undefined {
    if (this._replyParentMessageId == null) return undefined;
    return {
      displayName: this._replyParentDisplayName!,
      messageBody: this._replyParentMessageBody!,
      messageId: this._replyParentMessageId,
      userId: this._replyParentUserId!,
      userLogin: this._replyParentUserLogin!,
    };
  }

  public get source(): SharedChatSource | undefined {
    if (this._sourceId == null) return undefined;
    return {
      id: this._sourceId,
      channelId: this._sourceChannelId!,
      badges: this._sourceBadges!,
      badgesRaw: this._sourceBadgesRaw!,
      badgeInfo: this._sourceBadgeInfo!,
      badgeInfoRaw: this._sourceBadgeInfoRaw!,
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

  /** @deprecated Use {@link sender.badgeInfo} instead. */
  public get badgeInfo(): TwitchBadgesList {
    return this._badgeInfo;
  }

  /** @deprecated Use {@link sender.badgeInfoRaw} instead. */
  public get badgeInfoRaw(): string {
    return this._badgeInfoRaw;
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

  /** @deprecated Use {@link sender.isMod} instead. */
  public get isMod(): boolean {
    return this._isMod;
  }

  /** @deprecated Use {@link sender.isModRaw} instead. */
  public get isModRaw(): string {
    return this._isModRaw;
  }

  /** @deprecated Use {@link channel.id} instead. */
  public get channelID(): string {
    return this._channelRoomId;
  }

  /** @deprecated Use {@link timestamp} instead. */
  public get serverTimestamp(): Date {
    return this._timestamp;
  }

  /** @deprecated Use {@link timestampRaw} instead. */
  public get serverTimestampRaw(): string {
    return this._timestampRaw;
  }

  /** @deprecated Use {@link replyParent.displayName} instead. */
  public get replyParentDisplayName(): string | undefined {
    return this._replyParentDisplayName;
  }

  /** @deprecated Use {@link replyParent.messageBody} instead. */
  public get replyParentMessageBody(): string | undefined {
    return this._replyParentMessageBody;
  }

  /** @deprecated Use {@link replyParent.messageId} instead. */
  public get replyParentMessageID(): string | undefined {
    return this._replyParentMessageId;
  }

  /** @deprecated Use {@link replyParent.userId} instead. */
  public get replyParentUserID(): string | undefined {
    return this._replyParentUserId;
  }

  /** @deprecated Use {@link replyParent.userLogin} instead. */
  public get replyParentUserLogin(): string | undefined {
    return this._replyParentUserLogin;
  }

  /** @deprecated Use {@link source.id} instead. */
  public get sourceID(): string | undefined {
    return this._sourceId;
  }

  /** @deprecated Use {@link source.channelID} instead. */
  public get sourceChannelID(): string | undefined {
    return this._sourceChannelId;
  }

  /** @deprecated Use {@link source.badges} instead. */
  public get sourceBadges(): TwitchBadgesList | undefined {
    return this._sourceBadges;
  }

  /** @deprecated Use {@link source.badgesRaw} instead. */
  public get sourceBadgesRaw(): string | undefined {
    return this._sourceBadgesRaw;
  }

  /** @deprecated Use {@link source.badgeInfo} instead. */
  public get sourceBadgesInfo(): TwitchBadgesList | undefined {
    return this._sourceBadgeInfo;
  }

  /** @deprecated Use {@link source.badgeInfoRaw} instead. */
  public get sourceBadgesInfoRaw(): string | undefined {
    return this._sourceBadgeInfoRaw;
  }

  public constructor(ircMessage: IRCMessage) {
    super(ircMessage);

    const { isAction, message } = parseActionAndMessage(
      requireParameter(this, 1),
    );
    this._content = message;
    this._action = isAction;

    this._senderLogin = requireNickname(this);

    const tagParser = tagParserFor(this.ircTags);
    this._channelRoomId = tagParser.requireString("room-id");

    this._senderId = tagParser.requireString("user-id");

    this._badgeInfo = tagParser.requireBadges("badge-info");
    this._badgeInfoRaw = tagParser.requireString("badge-info");

    this._badges = tagParser.requireBadges("badges");
    this._badgesRaw = tagParser.requireString("badges");

    this._bits = tagParser.getInt("bits");
    this._bitsRaw = tagParser.getString("bits");

    this._color = tagParser.getColor("color");
    this._colorRaw = tagParser.requireString("color");

    // trim: Twitch workaround for unsanitized data, see https://github.com/robotty/dank-twitch-irc/issues/33
    this._displayName = tagParser.requireString("display-name").trim();

    this._emotes = tagParser.requireEmotes("emotes", this._content);
    this._emotesRaw = tagParser.requireString("emotes");

    this._flags = tagParser.getFlags("flags", this._content);
    this._flagsRaw = tagParser.getString("flags");

    this._replyParentDisplayName = tagParser.getTrimmedString(
      "reply-parent-display-name",
    );
    this._replyParentMessageBody = tagParser.getString("reply-parent-msg-body");
    this._replyParentMessageId = tagParser.getString("reply-parent-msg-id");
    this._replyParentUserId = tagParser.getString("reply-parent-user-id");
    this._replyParentUserLogin = tagParser.getString("reply-parent-user-login");

    this._id = tagParser.requireString("id");

    this._isMod = tagParser.requireBoolean("mod");
    this._isModRaw = tagParser.requireString("mod");

    this._timestamp = tagParser.requireTimestamp("tmi-sent-ts");
    this._timestampRaw = tagParser.requireString("tmi-sent-ts");

    this._sourceId = tagParser.getString("source-id");
    this._sourceChannelId = tagParser.getString("source-room-id");
    this._sourceBadges = tagParser.getBadges("source-badges");
    this._sourceBadgesRaw = tagParser.getString("source-badges");
    this._sourceBadgeInfo = tagParser.getBadges("source-badge-info");
    this._sourceBadgeInfoRaw = tagParser.getString("source-badge-info");
  }

  /**
   * @deprecated Use {@link sender} instead.
   */
  // eslint-disable-next-line ts/no-deprecated
  public extractUserState(): PrivmsgUserState {
    return {
      badgeInfo: this._badgeInfo,
      badgeInfoRaw: this._badgeInfoRaw,
      badges: this._badges,
      badgesRaw: this._badgesRaw,
      color: this._color,
      colorRaw: this._colorRaw,
      displayName: this._displayName,
      isMod: this._isMod,
      isModRaw: this._isModRaw,
    };
  }

  public isCheer(): this is CheerPrivmsgMessage {
    return this._bits != null;
  }

  public isReply(): this is ReplyPrivmsgMessage {
    return this._replyParentMessageId != null;
  }

  /**
   * Whether or not this message is during a shared chat session.
   * This does NOT necessarily mean that the message is originating from another channel.
   * Check if `message.source.channelId !== message.channel.id` for that
   * @see https://dev.twitch.tv/docs/chat/irc/#shared-chat
   */
  // eslint-disable-next-line ts/no-deprecated
  public isSharedChat(): this is this & SharedChatFields {
    return this._sourceId != null;
  }
}
