import type { Color } from "../color";
import { ParseError } from "./parse-error";

const rgbColorRegex = /^#([\dA-F]{2})([\dA-F]{2})([\dA-F]{2})$/i;

export function parseColor(colorSource: string): Color {
  const match = rgbColorRegex.exec(colorSource);
  if (match == null) {
    throw new ParseError(
      `Malformed color value "${colorSource}", must be in format #AABBCC`,
    );
  }

  const r = Number.parseInt(match[1]!, 16);
  const g = Number.parseInt(match[2]!, 16);
  const b = Number.parseInt(match[3]!, 16);

  return { r, g, b };
}
