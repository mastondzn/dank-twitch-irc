import { ValidationError } from "./validation-error";
import { reasonForValue } from "~/utils/reason-for-value";

const messageIdRegex = /^[\w-]+$/;

export function validateMessageId(input?: string | null): void {
  if (input == null || !messageIdRegex.test(input)) {
    throw new ValidationError(
      `Message ID ${reasonForValue(input)} is invalid/malformed`,
    );
  }
}
