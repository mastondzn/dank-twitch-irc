import type { TwitchBadgesList } from "./badges";

export interface SharedChatSource {
  readonly id: string;
  readonly channelId: string;
  readonly badges: TwitchBadgesList;
  readonly badgesRaw: string;
  readonly badgeInfo: TwitchBadgesList;
  readonly badgeInfoRaw: string;
}

/** @deprecated Use {@link SharedChatSource} instead. */
export interface SharedChatFields {
  /** @deprecated Use {@link SharedChatSource.id} instead. */
  sourceID: string;
  /** @deprecated Use {@link SharedChatSource.channelId} instead. */
  sourceChannelID: string;
  /** @deprecated Use {@link SharedChatSource.badges} instead. */
  sourceBadges: TwitchBadgesList;
  /** @deprecated Use {@link SharedChatSource.badgesRaw} instead. */
  sourceBadgesRaw: string;
  /** @deprecated Use {@link SharedChatSource.badgeInfo} instead. */
  sourceBadgesInfo: TwitchBadgesList;
  /** @deprecated Use {@link SharedChatSource.badgeInfoRaw} instead. */
  sourceBadgesInfoRaw: string;
}
