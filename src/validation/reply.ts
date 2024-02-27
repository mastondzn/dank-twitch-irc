import { ValidationError } from "./validation-error";
import { reasonForValue } from "~/utils/reason-for-value";

const messageIDRegex = /^[\w-]+$/;

export function validateMessageID(input?: string | null): void {
  if (input == null || !messageIDRegex.test(input)) {
    throw new ValidationError(
      `Message ID ${reasonForValue(input)} is invalid/malformed`,
    );
  }
}
