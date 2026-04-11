import type { UserState } from "~/message/twitch-types/userstate";
import { UserStateTracker } from "../userstate-tracker";

interface FastSpamResult {
  fastSpam: boolean;
  certain: boolean;
}

export function canSpamFast(
  channelName: string,
  loggedInUsername: string,
  userStateInput: UserStateTracker | UserState,
): FastSpamResult {
  // broadcaster?
  if (channelName === loggedInUsername) {
    return { fastSpam: true, certain: true };
  }

  const userState =
    userStateInput instanceof UserStateTracker
      ? userStateInput.getChannelState(channelName)
      : userStateInput;

  // no data
  if (userState == null) {
    return { fastSpam: false, certain: false };
  }

  // any of these?
  return {
    fastSpam:
      userState.isMod ||
      userState.badges.hasVIP ||
      userState.badges.hasModerator ||
      userState.badges.hasBroadcaster,
    certain: true,
  };
}
