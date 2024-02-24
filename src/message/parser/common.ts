import { ParseError } from "./parse-error";

export function parseIntThrowing(string_: string | null | undefined): number {
  if (string_ == null) {
    throw new ParseError("String source for integer is null/undefined");
  }

  const parsedInt = Number.parseInt(string_);
  if (Number.isNaN(parsedInt)) {
    throw new ParseError(`Invalid integer for string "${string_}"`);
  }

  return parsedInt;
}
