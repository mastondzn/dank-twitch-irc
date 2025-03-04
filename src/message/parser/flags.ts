import type { TwitchFlagList } from "../flags";
import { TwitchFlag } from "../flag";

export function parseFlags(
  messageText: string,
  flagsSource: string,
): TwitchFlagList {
  const flags: TwitchFlagList = [];

  // eslint-disable-next-line regexp/no-super-linear-backtracking
  const regex = /^(?:,?\d+-\d+:(?:[AIPS]\.\d+\/?)*)+$/g;

  const matchFlagsSource = flagsSource.match(regex);
  if (flagsSource.length <= 0 || matchFlagsSource === null) {
    return flags;
  }

  const messageCharacters = messageText.split("");

  for (const flagInstancesSource of flagsSource.split(",")) {
    const [indexes, instancesSource] = flagInstancesSource.split(":", 2) as [
      string,
      string,
    ];

    let [startIndex, endIndex] = indexes.split("-", 2).map(Number) as [
      number,
      number,
    ];

    // to make endIndex exclusive
    endIndex = endIndex + 1;

    // flags tag can have wildly out-of-bounds indexes
    if (startIndex < 0) {
      startIndex = 0;
    }
    if (endIndex > messageCharacters.length) {
      endIndex = messageCharacters.length;
    }

    const flagText = messageCharacters.slice(startIndex, endIndex).join("");

    const categories: TwitchFlag["categories"] = [];
    for (const instanceSource of instancesSource.split("/")) {
      if (instanceSource.length > 0) {
        const [category, score] = instanceSource.split(".");
        categories.push({
          category: category!,
          score: Number(score),
        });
      }
    }

    flags.push(new TwitchFlag(startIndex, endIndex, flagText, categories));
  }

  // sort by start index
  flags.sort((a, b) => a.startIndex - b.startIndex);

  return flags;
}
