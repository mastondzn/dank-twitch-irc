import type { TwitchBadgesList } from "./badges";

export interface SharedChatFields {
  /** The msg-id of the source message. */
  sourceID: string;
  /** The channel id where the message originated from (can be the same channel we received the message from) */
  sourceChannelID: string;
  sourceBadges: TwitchBadgesList;
  sourceBadgesRaw: string;
  sourceBadgesInfo: TwitchBadgesList;
  sourceBadgesInfoRaw: string;
}
