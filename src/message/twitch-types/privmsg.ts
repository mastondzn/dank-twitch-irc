import type { TwitchBadgesList } from "../badges";
import type { Color } from "../color";
import type { TwitchEmoteList } from "../emotes";
import type { TwitchFlagList } from "../flags";
import type { SharedChatFields } from "../shared-chat";
import type { UserState } from "./userstate";
import { ChannelIRCMessage } from "../irc/channel-irc-message";
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

interface CheerPrivmsgMessage extends PrivmsgMessage {
  readonly bits: number;
  readonly bitsRaw: string;
}

interface ReplyPrivmsgMessage extends PrivmsgMessage {
  readonly replyParentDisplayName: string;
  readonly replyParentMsgBody: string;
  readonly replyParentMsgID: string;
  readonly replyParentUserID: string;
  readonly replyParentUserLogin: string;
}

/**
 * Omits `emoteSets` and `emoteSetsRaw` from {@link UserState} (because they are not sent
 * for `PRIVMSG` messages)
 */
export type PrivmsgUserState = Omit<UserState, "emoteSets" | "emoteSetsRaw">;

export class PrivmsgMessage
  extends ChannelIRCMessage
  implements PrivmsgUserState, Partial<SharedChatFields>
{
  public readonly messageText: string;
  public readonly isAction: boolean;

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

  public readonly replyParentDisplayName: string | undefined;
  public readonly replyParentMessageBody: string | undefined;
  public readonly replyParentMessageID: string | undefined;
  public readonly replyParentUserID: string | undefined;
  public readonly replyParentUserLogin: string | undefined;

  public readonly messageID: string;

  public readonly isMod: boolean;
  public readonly isModRaw: string;

  public readonly channelID: string;

  public readonly serverTimestamp: Date;
  public readonly serverTimestampRaw: string;

  public readonly sourceID: string | undefined;
  public readonly sourceChannelID: string | undefined;
  public readonly sourceBadges: TwitchBadgesList | undefined;
  public readonly sourceBadgesRaw: string | undefined;
  public readonly sourceBadgesInfo: TwitchBadgesList | undefined;
  public readonly sourceBadgesInfoRaw: string | undefined;

  public constructor(ircMessage: IRCMessage) {
    super(ircMessage);

    const { isAction, message } = parseActionAndMessage(
      requireParameter(this, 1),
    );
    this.messageText = message;
    this.isAction = isAction;

    this.senderUsername = requireNickname(this);

    const tagParser = tagParserFor(this.ircTags);
    this.channelID = tagParser.requireString("room-id");

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

    this.emotes = tagParser.requireEmotes("emotes", this.messageText);
    this.emotesRaw = tagParser.requireString("emotes");

    this.flags = tagParser.getFlags("flags", this.messageText);
    this.flagsRaw = tagParser.getString("flags");

    this.replyParentDisplayName = tagParser.getTrimmedString(
      "reply-parent-display-name",
    );
    this.replyParentMessageBody = tagParser.getString("reply-parent-msg-body");
    this.replyParentMessageID = tagParser.getString("reply-parent-msg-id");
    this.replyParentUserID = tagParser.getString("reply-parent-user-id");
    this.replyParentUserLogin = tagParser.getString("reply-parent-user-login");

    this.messageID = tagParser.requireString("id");

    this.isMod = tagParser.requireBoolean("mod");
    this.isModRaw = tagParser.requireString("mod");

    this.serverTimestamp = tagParser.requireTimestamp("tmi-sent-ts");
    this.serverTimestampRaw = tagParser.requireString("tmi-sent-ts");

    this.sourceID = tagParser.getString("source-id");
    this.sourceChannelID = tagParser.getString("source-room-id");
    this.sourceBadges = tagParser.getBadges("source-badges");
    this.sourceBadgesRaw = tagParser.getString("source-badges");
    this.sourceBadgesInfo = tagParser.getBadges("source-badge-info");
    this.sourceBadgesInfoRaw = tagParser.getString("source-badge-info");
  }

  /**
   * Extracts a plain object only containing the fields defined by the
   * {@link PrivmsgUserState} interface.
   */
  public extractUserState(): PrivmsgUserState {
    return {
      badgeInfo: this.badgeInfo,
      badgeInfoRaw: this.badgeInfoRaw,
      badges: this.badges,
      badgesRaw: this.badgesRaw,
      color: this.color,
      colorRaw: this.colorRaw,
      displayName: this.displayName,
      isMod: this.isMod,
      isModRaw: this.isModRaw,
    };
  }

  public isCheer(): this is CheerPrivmsgMessage {
    return this.bits != null;
  }

  public isReply(): this is ReplyPrivmsgMessage {
    return this.replyParentMessageID != null;
  }

  /**
   * Whether or not this message is during a shared chat session.
   * This does NOT necessarily mean that the message is originating from another channel.
   * Check if `message.sourceChannelId !== message.channelId` for that
   * @see https://dev.twitch.tv/docs/chat/irc/#shared-chat
   */
  public isSharedChat(): this is this & SharedChatFields {
    return this.sourceID != null;
  }
}
