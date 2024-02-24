import { awaitJoinResponse } from "./join";
import type { SingleConnection } from "../client/connection";
import { MAX_OUTGOING_COMMAND_LENGTH } from "../constants";
import { splitIntoChunks } from "../utils/split-into-chunks";

export async function joinAll(
  conn: SingleConnection,
  channelNames: string[],
): Promise<Record<string, Error | undefined>> {
  // e.g. "JOIN #firstchannel,#secondchannel,#thirdchannel"
  // joining channels this way is much faster than sending individual JOIN commands
  // the twitch server cuts off messages at 4096 characters so we produce chunks of that size
  for (const channelName of channelNames) conn.wantedChannels.add(channelName);

  const channelChunks = splitIntoChunks(
    channelNames.map((element) => `#${element}`),
    ",",
    MAX_OUTGOING_COMMAND_LENGTH - "JOIN ".length,
  );

  const resultsMap: Record<string, Error | undefined> = {};

  for (const chunk of channelChunks) {
    conn.sendRaw(`JOIN ${chunk.join(",")}`);

    const chunkNames = chunk.map((s) => s.slice(1));
    const chunkPromises: Promise<unknown>[] = [];

    // we await the joining of all channels of this chunk in parallel
    for (const channelName of chunkNames) {
      chunkPromises.push(
        awaitJoinResponse(conn, channelName).then(
          () => {
            // on success
            conn.joinedChannels.add(channelName);
            resultsMap[channelName] = undefined;
          },
          (error) => {
            // on failure
            resultsMap[channelName] = error as Error;
          },
        ),
      );
    }

    await Promise.all(chunkPromises);
  }

  return resultsMap;
}
