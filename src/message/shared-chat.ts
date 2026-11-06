import type { TwitchBadgesList } from "./badges";

export interface SharedChatSource {
  readonly id: string;
  readonly channelId: string;
  readonly badges: TwitchBadgesList;
  readonly badgesRaw: string;
  readonly badgeInfo: TwitchBadgesList;
  readonly badgeInfoRaw: string;
}
