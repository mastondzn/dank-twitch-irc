import type { IRCMessageTags } from "../irc/tags";

const decodeMap: Record<string, string> = {
  "\\\\": "\\",
  "\\:": ";",
  "\\s": " ",
  "\\n": "\n",
  "\\r": "\r",
  "\\": "", // remove invalid backslashes
};

const decodeLookupRegex = /\\\\|\\:|\\s|\\n|\\r|\\/g;

// if value is undefined (no = in tagSrc) then value becomes null
export function decodeValue(value: string | undefined): string | null {
  if (value == null) {
    return null;
  }
  return value.replaceAll(decodeLookupRegex, (m) => decodeMap[m] ?? "");
}

export function parseTags(tagsSource: string | undefined): IRCMessageTags {
  const tags: IRCMessageTags = {};

  if (tagsSource == null) {
    return tags;
  }

  for (const tagSource of tagsSource.split(";")) {
    const keyValueDelimiter: number = tagSource.indexOf("=");

    // ">>>" turns any negative `keyValueDelimiter` into the max uint32, so we get the entire tagSrc for the key.
    const key = tagSource.slice(0, keyValueDelimiter >>> 0);

    let valueSource: string | null = null;
    if (keyValueDelimiter !== -1) {
      valueSource = decodeValue(tagSource.slice(keyValueDelimiter + 1));
    }

    tags[key] = valueSource;
  }

  return tags;
}
