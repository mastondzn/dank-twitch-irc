import type { TwitchBadge } from "./badge";

export class TwitchBadgesList extends Array<TwitchBadge> {
  public get hasAdmin(): boolean {
    return this.some((badge) => badge.isAdmin);
  }

  public get hasBits(): boolean {
    return this.some((badge) => badge.isBits);
  }

  public get hasBroadcaster(): boolean {
    return this.some((badge) => badge.isBroadcaster);
  }

  public get hasGlobalMod(): boolean {
    return this.some((badge) => badge.isGlobalMod);
  }

  public get hasModerator(): boolean {
    return this.some((badge) => badge.isModerator);
  }

  public get hasSubscriber(): boolean {
    return this.some((badge) => badge.isSubscriber);
  }

  public get hasStaff(): boolean {
    return this.some((badge) => badge.isStaff);
  }

  public get hasTurbo(): boolean {
    return this.some((badge) => badge.isTurbo);
  }

  public get hasVIP(): boolean {
    return this.some((badge) => badge.isVIP);
  }

  public get hasPrediction(): boolean {
    return this.some((badge) => badge.isPrediction);
  }

  public toString(): string {
    return this.join(",");
  }
}
