import { parseIntThrowing } from "./common";
import { ParseError } from "./parse-error";
import { TwitchEmote } from "../emote";
import type { TwitchEmoteList } from "../emotes";

export function parseEmotes(
  messageText: string,
  emotesSource: string,
): TwitchEmoteList {
  const emotes: TwitchEmoteList = [];

  if (emotesSource.length <= 0) {
    return emotes;
  }

  const messageCharacters = [...messageText];

  for (const emoteInstancesSource of emotesSource.split("/")) {
    const [emoteID, instancesSource] = emoteInstancesSource.split(":", 2) as [
      string,
      string,
    ];
    for (const instanceSource of instancesSource.split(",")) {
      let [startIndex, endIndex] = instanceSource
        .split("-", 2)
        .map((element) => parseIntThrowing(element)) as [
        number,
        number | undefined,
      ];

      if (endIndex == null) {
        throw new ParseError(
          `No - found in emote index range "${instanceSource}"`,
        );
      }

      // to make endIndex exclusive
      endIndex = endIndex + 1;

      // workaround for Twitch bug: https://github.com/twitchdev/issues/issues/104
      if (startIndex < 0) {
        startIndex = 0;
      }
      if (endIndex > messageCharacters.length) {
        endIndex = messageCharacters.length;
      }

      const emoteText = messageCharacters.slice(startIndex, endIndex).join("");

      emotes.push(new TwitchEmote(emoteID, startIndex, endIndex, emoteText));
    }
  }

  // sort by start index
  emotes.sort((a, b) => a.startIndex - b.startIndex);

  return emotes;
}
