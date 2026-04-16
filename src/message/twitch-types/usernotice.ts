import type { TwitchBadgesList } from "../badges";
import type { Color } from "../color";
import type { TwitchEmoteList } from "../emotes";
import type { TwitchFlagList } from "../flags";
import type { IRCMessageTags } from "../irc/tags";
import type { SharedChatFields, SharedChatSource } from "../shared-chat";
import type { MessageSender } from "./privmsg";
import { ChannelIRCMessage, type Channel } from "../irc/channel-irc-message";
import { type IRCMessageData, getParameter } from "../irc/irc-message";
import {
  tagParserFor,
  convertToBoolean,
  convertToInt,
  convertToString,
  requireData,
} from "../parser/tag-values";
import { kebabToCamelCase } from "~/utils/kebab-to-camel";

const convertersMap: Record<
  string,
  (value: string) => string | boolean | number
> = {
  "msg-param-cumulative-months": convertToInt,
  "msg-param-gift-months": convertToInt,
  "msg-param-sender-count": convertToInt,
  "msg-param-months": convertToInt,
  "msg-param-promo-gift-total": convertToInt,
  "msg-param-should-share-streak": convertToBoolean,
  "msg-param-streak-months": convertToInt,
  "msg-param-viewerCount": convertToInt,
  "msg-param-threshold": convertToInt,
  "msg-param-mass-gift-count": convertToInt,
  "msg-param-origin-id": convertToString,
  "msg-param-sub-plan": convertToString,
  "msg-param-color": convertToString,
  "msg-param-copoReward": convertToInt,
  "msg-param-value": convertToInt,
  "msg-param-category": convertToString,
};

export function getCamelCasedName(tagKey: string): string {
  let newKey = tagKey;

  // remove the leading msg-param-
  newKey = newKey.slice(10);

  // camel case
  newKey = kebabToCamelCase(newKey);

  // To be consistent with the rest of the library,
  // don't camelcase username as userName
  newKey = newKey.replaceAll(/([Uu])serName/g, "$1sername");

  return newKey;
}

export type EventParameters = Record<string, string | number | boolean>;
export type EventParametersMaybe = Record<string, string | undefined>;

export function extractEventParameters(tags: IRCMessageTags): EventParameters {
  const parameters: EventParameters = {};

  // converts all msg-param-* tags into a new "params" object where keys are camelCased
  // and boolean/integer tags are parsed (including a identically named "Raw" property).
  // e.g. msg-param-should-share-streak would become
  // shouldShareStreak: true
  // shouldShareStreakRaw: '1'
  for (const tagKey of Object.keys(tags)) {
    if (!tagKey.startsWith("msg-param-")) {
      continue;
    }

    const newKey = getCamelCasedName(tagKey);
    const converter = convertersMap[tagKey];
    if (converter) {
      parameters[newKey] = requireData(tags, tagKey, converter);
      parameters[`${newKey}Raw`] = requireData(tags, tagKey, convertToString);
    } else {
      parameters[newKey] = requireData(tags, tagKey, convertToString);
    }
  }

  return parameters;
}

export interface SharesStreakSubParameters extends EventParameters {
  shouldShareStreak: true;
  streakMonths: number;
  streakMonthsRaw: string;
}

export interface HiddenStreakSubParameters extends EventParameters {
  shouldShareStreak: false;
  streakMonths: 0;
  streakMonthsRaw: "0";
}

export type StreakSubParameters =
  | SharesStreakSubParameters
  | HiddenStreakSubParameters;

// sub, resub
export type SubEventParameters = EventParameters &
  StreakSubParameters & {
    cumulativeMonths: number;
    cumulativeMonthsRaw: string;

    subPlan: string;
    subPlanName: string;
  };

// raid
export interface RaidParameters extends EventParameters {
  displayName: string;
  login: string;
  viewerCount: number;
  viewerCountRaw: string;
}

// subgift, anonsubgift
export interface SubgiftParameters extends EventParameters {
  months: number;
  monthsRaw: string;

  recipientDisplayName: string;
  recipientId: number;

  recipientUsername: string;

  subPlan: string;
  subPlanName: string;
}
export type AnonSubgiftParameters = SubgiftParameters;

// massgift
export interface MassSubgiftParameters extends EventParameters {
  massGiftCount: number;
  subPlan: string;
}

// anongiftpaidupgrade
export type AnonGiftPaidUpgradeParameters = EventParameters & {
  promoGiftTotal?: number;
  promoGiftTotalRaw?: string;
  promoName?: string;
};

// giftpaidupgrade
export type GiftPaidUpgradeParameters = AnonGiftPaidUpgradeParameters & {
  senderLogin: string;
  senderName: string;
};

// ritual
export interface RitualParameters extends EventParameters {
  ritualName: string;
}

// bitsbadgetier
export interface BitsBadgeTierParameters extends EventParameters {
  threshold: number;
  thresholdRaw: string;
}

// announcement
export interface AnnouncementParameters extends EventParametersMaybe {
  color?: string;
}

// viewermilestone
export interface ViewerMilestoneParameters extends EventParameters {
  /** The amount of channel points the user gained for reaching this milestone. */
  copoReward: number;
  copoRewardRaw: string;

  /** The value of the respective milestone category. (usually amount of viewed streams in a row, for "watch-streak") */
  value: number;
  valueRaw: string;

  /** The category of the milestone. (usually "watch-streak") */
  category: string;
}

export interface SpecificUsernoticeMessage<
  I extends string,
  E extends EventParameters,
> {
  readonly messageTypeId: I;
  readonly eventParams: E;
}

export interface AnAnnouncementUsernoticeMessage<
  I extends string,
  E extends EventParametersMaybe,
> {
  readonly messageTypeId: I;
  readonly eventParams: E;
}

export type SubUsernoticeMessage = SpecificUsernoticeMessage<
  "sub",
  SubEventParameters
>;
export type ResubUsernoticeMessage = SpecificUsernoticeMessage<
  "resub",
  SubEventParameters
>;
export type RaidUsernoticeMessage = SpecificUsernoticeMessage<
  "raid",
  RaidParameters
>;
export type SubgiftUsernoticeMessage = SpecificUsernoticeMessage<
  "subgift",
  SubgiftParameters
>;
export type MassSubgiftUsernoticeMessage = SpecificUsernoticeMessage<
  "submysterygift",
  MassSubgiftParameters
>;
export type AnonSubgiftUsernoticeMessage = SpecificUsernoticeMessage<
  "anonsubgift",
  AnonSubgiftParameters
>;
export type AnonGiftPaidUpgradeUsernoticeMessage = SpecificUsernoticeMessage<
  "anongiftpaidupgrade",
  AnonGiftPaidUpgradeParameters
>;
export type GiftPaidUpgradeUsernoticeMessage = SpecificUsernoticeMessage<
  "giftpaidupgrade",
  GiftPaidUpgradeParameters
>;
export type RitualUsernoticeMessage = SpecificUsernoticeMessage<
  "ritual",
  RitualParameters
>;
export type BitsBadgeTierUsernoticeMessage = SpecificUsernoticeMessage<
  "bitsbadgetier",
  BitsBadgeTierParameters
>;
export type AnnouncementUsernoticeMessage = AnAnnouncementUsernoticeMessage<
  "announcement",
  AnnouncementParameters
>;
export type ViewerMilestoneUsernoticeMessage = SpecificUsernoticeMessage<
  "viewermilestone",
  ViewerMilestoneParameters
>;

interface CheerUsernoticeMessage extends UsernoticeMessage {
  readonly bits: number;
  readonly bitsRaw: string;
}

export class UsernoticeMessage
  extends ChannelIRCMessage
  // eslint-disable-next-line ts/no-deprecated
  implements Partial<SharedChatFields & { sourceMessageTypeId: string }>
{
  private readonly _channelRoomId: string;
  private readonly _content: string | undefined;
  private readonly _systemMessage: string;
  private readonly _messageTypeId: string;
  private readonly _messageType: string;
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
  private readonly _id: string;
  private readonly _isMod: boolean;
  private readonly _isModRaw: string;
  private readonly _timestamp: Date;
  private readonly _timestampRaw: string;
  private readonly _eventParams: EventParameters;
  private readonly _sourceId: string | undefined;
  private readonly _sourceChannelId: string | undefined;
  private readonly _sourceBadges: TwitchBadgesList | undefined;
  private readonly _sourceBadgesRaw: string | undefined;
  private readonly _sourceBadgeInfo: TwitchBadgesList | undefined;
  private readonly _sourceBadgeInfoRaw: string | undefined;
  private readonly _sourceMessageTypeId: string | undefined;

  public get content(): string | undefined {
    return this._content;
  }

  public get systemMessage(): string {
    return this._systemMessage;
  }

  /** sub, resub, subgift, etc..., or the uuid of the message if its a shared chat */
  public get messageTypeId(): string {
    return this._messageTypeId;
  }

  /** @deprecated Use {@link messageTypeId} instead. */
  public get messageTypeID(): string {
    return this._messageTypeId;
  }

  public get messageType(): string {
    return this._messageType;
  }

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

  public get eventParams(): EventParameters {
    return this._eventParams;
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

  public get sourceMessageTypeId(): string | undefined {
    return this._sourceMessageTypeId;
  }

  // ---- Deprecated aliases ----

  /** @deprecated Use {@link channel.id} instead. */
  public get channelID(): string {
    return this._channelRoomId;
  }

  /** @deprecated Use {@link content} instead. */
  public get messageText(): string | undefined {
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

  /** @deprecated Use {@link timestamp} instead. */
  public get serverTimestamp(): Date {
    return this._timestamp;
  }

  /** @deprecated Use {@link timestampRaw} instead. */
  public get serverTimestampRaw(): string {
    return this._timestampRaw;
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

  /** @deprecated Use {@link sourceMessageTypeId} instead. */
  public get sourceMessageTypeID(): string | undefined {
    return this._sourceMessageTypeId;
  }

  public constructor(message: IRCMessageData) {
    super(message);

    this._content = getParameter(this, 1);

    const tagParser = tagParserFor(this.ircTags);
    this._channelRoomId = tagParser.requireString("room-id");

    this._systemMessage = tagParser.requireString("system-msg");

    this._messageTypeId = tagParser.requireString("msg-id");

    this._senderLogin = tagParser.requireString("login");

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

    if (this._content) {
      this._emotes = tagParser.requireEmotes("emotes", this._content);
      this._flags = tagParser.getFlags("flags", this._content);
    } else {
      this._emotes = [];
      this._flags = undefined;
    }
    this._emotesRaw = tagParser.requireString("emotes");

    this._flagsRaw = tagParser.getString("flags");

    this._id = tagParser.requireString("id");

    this._isMod = tagParser.requireBoolean("mod");
    this._isModRaw = tagParser.requireString("mod");

    this._timestamp = tagParser.requireTimestamp("tmi-sent-ts");
    this._timestampRaw = tagParser.requireString("tmi-sent-ts");

    this._eventParams = extractEventParameters(this.ircTags);

    this._sourceId = tagParser.getString("source-id");
    this._sourceChannelId = tagParser.getString("source-room-id");
    this._sourceBadges = tagParser.getBadges("source-badges");
    this._sourceBadgesRaw = tagParser.getString("source-badges");
    this._sourceBadgeInfo = tagParser.getBadges("source-badge-info");
    this._sourceBadgeInfoRaw = tagParser.getString("source-badge-info");
    this._sourceMessageTypeId = tagParser.getString("source-msg-id");

    // when in shared chat, the message type is the source message type
    this._messageType =
      this._sourceMessageTypeId === "sharedchatnotice"
        ? this._messageTypeId
        : (this._sourceMessageTypeId ?? this._messageTypeId);
  }

  public isCheer(): this is CheerUsernoticeMessage {
    return this._bits != null;
  }

  public isSub(): this is SubUsernoticeMessage {
    return this._messageType === "sub";
  }

  public isResub(): this is ResubUsernoticeMessage {
    return this._messageType === "resub";
  }

  public isRaid(): this is RaidUsernoticeMessage {
    return this._messageType === "raid";
  }

  public isSubgift(): this is SubgiftUsernoticeMessage {
    return this._messageType === "subgift";
  }

  public isMassSubgift(): this is MassSubgiftParameters {
    return this._messageType === "submysterygift";
  }

  public isAnonSubgift(): this is AnonSubgiftUsernoticeMessage {
    return this._messageType === "anonsubgift";
  }

  public isAnonGiftPaidUpgrade(): this is AnonGiftPaidUpgradeUsernoticeMessage {
    return this._messageType === "anongiftpaidupgrade";
  }

  public isGiftPaidUpgrade(): this is GiftPaidUpgradeUsernoticeMessage {
    return this._messageType === "giftpaidupgrade";
  }

  public isRitual(): this is RitualUsernoticeMessage {
    return this._messageType === "ritual";
  }

  public isBitsBadgeTier(): this is BitsBadgeTierUsernoticeMessage {
    return this._messageType === "bitsbadgetier";
  }

  public isAnnouncement(): this is AnnouncementUsernoticeMessage {
    return this._messageType === "announcement";
  }

  public isViewerMilestone(): this is ViewerMilestoneUsernoticeMessage {
    return this._messageType === "viewermilestone";
  }

  /**
   * Whether or not this message is during a shared chat session.
   * This does NOT necessarily mean that the message is originating from another channel.
   * Check if `message.source.channelId !== message.channel.id` for that
   * @see https://dev.twitch.tv/docs/chat/irc/#shared-chat
   */
  public isSharedChat(): this is this &
    // eslint-disable-next-line ts/no-deprecated
    SharedChatFields & { sourceMessageTypeId: string } {
    return this._sourceId != null;
  }
}
