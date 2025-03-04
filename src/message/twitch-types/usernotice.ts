import type { TwitchBadgesList } from "../badges";
import type { Color } from "../color";
import type { TwitchEmoteList } from "../emotes";
import type { TwitchFlagList } from "../flags";
import type { IRCMessageTags } from "../irc/tags";
import type { SharedChatFields } from "../shared-chat";
import { ChannelIRCMessage } from "../irc/channel-irc-message";
import { type IRCMessageData, getParameter } from "../irc/irc-message";
import {
  convertToBoolean,
  convertToInt,
  convertToString,
  requireData,
  tagParserFor,
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

  // convert somethingId to somethingID
  newKey = newKey.replaceAll(/Id$/g, "ID");

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
  recipientID: number;

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
  readonly messageTypeID: I;
  readonly eventParams: E;
}

export interface AnAnnouncementUsernoticeMessage<
  I extends string,
  E extends EventParametersMaybe,
> {
  readonly messageTypeID: I;
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
  implements Partial<SharedChatFields & { sourceMessageTypeID: string }>
{
  public readonly channelID: string;

  public readonly messageText: string | undefined;
  public readonly systemMessage: string;

  /** sub, resub, subgift, etc..., or the uuid of the message if its a shared chat */
  public readonly messageTypeID: string;
  public readonly messageType: string;

  public readonly senderUsername: string;
  public readonly senderUserID: string;

  public readonly badgeInfo: TwitchBadgesList;
  public readonly badgeInfoRaw: string;

  public readonly badges: TwitchBadgesList;
  public readonly badgesRaw: string;

  public readonly bits: number | undefined;
  public readonly bitsRaw: string | undefined;

  public readonly color: Color | undefined;
  public readonly colorRaw: string;

  public readonly displayName: string;

  public readonly emotes: TwitchEmoteList;
  public readonly emotesRaw: string;

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
  public readonly flags: TwitchFlagList | undefined;

  /**
   * Twitch AutoMod raw flags string.
   *
   * If the `flags` tag is missing or of a unparseable format, this will be `undefined`. This is unlike most other
   * attributes which when missing or malformed will fail the message parsing. However since this attribute is
   * completely undocumented we cannot rely on the `flags` tag being stable, so this soft fallback is used instead.
   * In short, ensure your implementation can handle the case where this is `undefined` or is in
   * a format you don't expect.
   */
  public readonly flagsRaw: string | undefined;

  public readonly messageID: string;

  public readonly isMod: boolean;
  public readonly isModRaw: string;

  public readonly serverTimestamp: Date;
  public readonly serverTimestampRaw: string;

  public readonly eventParams: EventParameters;

  public readonly sourceID: string | undefined;
  public readonly sourceChannelID: string | undefined;
  public readonly sourceBadges: TwitchBadgesList | undefined;
  public readonly sourceBadgesRaw: string | undefined;
  public readonly sourceBadgesInfo: TwitchBadgesList | undefined;
  public readonly sourceBadgesInfoRaw: string | undefined;
  public readonly sourceMessageTypeId: string | undefined;

  public constructor(message: IRCMessageData) {
    super(message);

    this.messageText = getParameter(this, 1);

    const tagParser = tagParserFor(this.ircTags);
    this.channelID = tagParser.requireString("room-id");

    this.systemMessage = tagParser.requireString("system-msg");

    this.messageTypeID = tagParser.requireString("msg-id");

    this.senderUsername = tagParser.requireString("login");

    this.senderUserID = tagParser.requireString("user-id");

    this.badgeInfo = tagParser.requireBadges("badge-info");
    this.badgeInfoRaw = tagParser.requireString("badge-info");

    this.badges = tagParser.requireBadges("badges");
    this.badgesRaw = tagParser.requireString("badges");

    this.bits = tagParser.getInt("bits");
    this.bitsRaw = tagParser.getString("bits");

    this.color = tagParser.getColor("color");
    this.colorRaw = tagParser.requireString("color");

    // trim: Twitch workaround for unsanitized data, see https://github.com/robotty/dank-twitch-irc/issues/33
    this.displayName = tagParser.requireString("display-name").trim();

    if (this.messageText) {
      this.emotes = tagParser.requireEmotes("emotes", this.messageText);
      this.flags = tagParser.getFlags("flags", this.messageText);
    } else {
      this.emotes = [];
    }
    this.emotesRaw = tagParser.requireString("emotes");

    this.flagsRaw = tagParser.getString("flags");

    this.messageID = tagParser.requireString("id");

    this.isMod = tagParser.requireBoolean("mod");
    this.isModRaw = tagParser.requireString("mod");

    this.serverTimestamp = tagParser.requireTimestamp("tmi-sent-ts");
    this.serverTimestampRaw = tagParser.requireString("tmi-sent-ts");

    this.eventParams = extractEventParameters(this.ircTags);

    this.sourceID = tagParser.getString("source-id");
    this.sourceChannelID = tagParser.getString("source-room-id");
    this.sourceBadges = tagParser.getBadges("source-badges");
    this.sourceBadgesRaw = tagParser.getString("source-badges");
    this.sourceBadgesInfo = tagParser.getBadges("source-badge-info");
    this.sourceBadgesInfoRaw = tagParser.getString("source-badge-info");
    this.sourceMessageTypeId = tagParser.getString("source-msg-id");

    // when in shared chat, the message type is the source message type
    this.messageType =
      this.sourceMessageTypeId === "sharedchatnotice"
        ? this.messageTypeID
        : this.sourceMessageTypeId ?? this.messageTypeID;
  }

  public isCheer(): this is CheerUsernoticeMessage {
    return this.bits != null;
  }

  public isSub(): this is SubUsernoticeMessage {
    return this.messageType === "sub";
  }

  public isResub(): this is ResubUsernoticeMessage {
    return this.messageType === "resub";
  }

  public isRaid(): this is RaidUsernoticeMessage {
    return this.messageType === "raid";
  }

  public isSubgift(): this is SubgiftUsernoticeMessage {
    return this.messageType === "subgift";
  }

  public isMassSubgift(): this is MassSubgiftParameters {
    return this.messageType === "submysterygift";
  }

  public isAnonSubgift(): this is AnonSubgiftUsernoticeMessage {
    return this.messageType === "anonsubgift";
  }

  public isAnonGiftPaidUpgrade(): this is AnonGiftPaidUpgradeUsernoticeMessage {
    return this.messageType === "anongiftpaidupgrade";
  }

  public isGiftPaidUpgrade(): this is GiftPaidUpgradeUsernoticeMessage {
    return this.messageType === "giftpaidupgrade";
  }

  public isRitual(): this is RitualUsernoticeMessage {
    return this.messageType === "ritual";
  }

  public isBitsBadgeTier(): this is BitsBadgeTierUsernoticeMessage {
    return this.messageType === "bitsbadgetier";
  }

  public isAnnouncement(): this is AnnouncementUsernoticeMessage {
    return this.messageType === "announcement";
  }

  public isViewerMilestone(): this is ViewerMilestoneUsernoticeMessage {
    return this.messageType === "viewermilestone";
  }

  /**
   * Whether or not this message is during a shared chat session.
   * This does NOT necessarily mean that the message is originating from another channel.
   * Check if `message.sourceChannelId !== message.channelId` for that
   * @see https://dev.twitch.tv/docs/chat/irc/#shared-chat
   */
  public isSharedChat(): this is this &
    SharedChatFields & { sourceMessageTypeID: string } {
    return this.sourceID != null;
  }
}
