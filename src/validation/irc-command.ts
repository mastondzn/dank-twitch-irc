import { ValidationError } from "./validation-error";

export function validateIRCCommand(command: string): void {
  if (command.includes("\n") || command.includes("\r")) {
    throw new ValidationError(String.raw`IRC command may not include \n or \r`);
  }
}
