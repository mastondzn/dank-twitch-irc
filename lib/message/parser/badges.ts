import { ParseError } from "./parse-error";
import { TwitchBadge } from "../badge";
import { TwitchBadgesList } from "../badges";

export function parseSingleBadge(badgeSource: string): TwitchBadge {
  // src format: <badge>/<version>
  // src format for predictions: <badge>/<text with maybe an additional "/" slash or one of those ⸝>

  let badgeName: string | undefined;
  let badgeVersion: string | undefined;

  const firstSeparatorIndex = badgeSource.indexOf("/");

  if (firstSeparatorIndex === -1) {
    badgeName = badgeSource;
  } else {
    badgeName = badgeSource.slice(0, firstSeparatorIndex);
    badgeVersion = badgeSource.slice(firstSeparatorIndex + 1);
  }

  if (typeof badgeName !== "string" || typeof badgeVersion !== "string") {
    throw new ParseError(
      `Badge source "${badgeSource}" did not contain '/' character`,
    );
  }

  // This is the predictions badge/badge-info, it should have badgeVersion escaped.
  if (badgeName === "predictions") {
    badgeVersion = badgeVersion.replaceAll("⸝", ",");
  }

  if (badgeName.length <= 0) {
    throw new ParseError(`Empty badge name on badge "${badgeSource}"`);
  }

  if (badgeVersion.length <= 0) {
    throw new ParseError(`Empty badge version on badge "${badgeSource}"`);
  }

  return new TwitchBadge(badgeName, badgeVersion);
}

export function parseBadges(badgesSource: string): TwitchBadgesList {
  // src format: <badge>/<version>,<badge>/<version>,<badge>/<version>

  if (badgesSource.length <= 0) {
    return new TwitchBadgesList();
  }

  const badges = new TwitchBadgesList();
  for (const badgeSource of badgesSource.split(",")) {
    badges.push(parseSingleBadge(badgeSource));
  }
  return badges;
}
