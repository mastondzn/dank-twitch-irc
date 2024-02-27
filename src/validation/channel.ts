import { ValidationError } from "./validation-error";
import { reasonForValue } from "~/utils/reason-for-value";

const channelNameRegex = /^[\d_a-z]{1,25}$/;

export function validateChannelName(input?: string | null): void {
  if (input == null || !channelNameRegex.test(input)) {
    throw new ValidationError(
      `Channel name ${reasonForValue(input)} is invalid/malformed`,
    );
  }
}

export function correctChannelName(input: string): string {
  return input.replace(/^#/, "");
}
