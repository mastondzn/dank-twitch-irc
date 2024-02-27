import { UserStateTracker } from "../userstate-tracker";
import type { UserState } from "~/message/twitch-types/userstate";

interface FastSpamResult {
  fastSpam: boolean;
  certain: boolean;
}

// userStateTracker is optional in case no user state tracker
// is installed on the client
export function canSpamFast(
  channelName: string,
  loggedInUsername: string,
  userStateTracker?: UserStateTracker,
): FastSpamResult;

export function canSpamFast(
  channelName: string,
  loggedInUsername: string,
  userState: UserState,
): FastSpamResult;

export function canSpamFast(
  channelName: string,
  loggedInUsername: string,
  userStateInput: UserStateTracker | UserState | undefined,
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
