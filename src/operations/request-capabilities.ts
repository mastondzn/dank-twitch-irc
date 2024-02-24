import { type Condition, awaitResponse } from "../await/await-response";
import type { SingleConnection } from "../client/connection";
import { ConnectionError } from "../client/errors";
import { CapMessage } from "../message/twitch-types/cap";

export class CapabilitiesError extends ConnectionError {}

export function acknowledgesCapabilities(
  requestedCapabilities: string[],
): Condition {
  return (event) =>
    event instanceof CapMessage &&
    event.subCommand === "ACK" &&
    requestedCapabilities.every((cap) => event.capabilities.includes(cap));
}

export function deniedAnyCapability(
  requestedCapabilities: string[],
): Condition {
  return (event) =>
    event instanceof CapMessage &&
    event.subCommand === "NAK" &&
    requestedCapabilities.some((cap) => event.capabilities.includes(cap));
}

export async function requestCapabilities(
  conn: SingleConnection,
  requestMembershipCapability: boolean,
): Promise<void> {
  const capabilities = ["twitch.tv/commands", "twitch.tv/tags"];
  if (requestMembershipCapability) {
    capabilities.push("twitch.tv/membership");
  }
  conn.sendRaw(`CAP REQ :${capabilities.join(" ")}`);

  // CAP ACK :twitch.tv/commands twitch.tv/tags twitch.tv/membership
  // CAP NAK :twitch.tv/invalid
  await awaitResponse(conn, {
    success: acknowledgesCapabilities(capabilities),
    failure: deniedAnyCapability(capabilities),
    errorType: (message, cause) => new CapabilitiesError(message, cause),
    errorMessage: `Failed to request server capabilities ${capabilities.join(
      ", ",
    )}`,
  });
}
