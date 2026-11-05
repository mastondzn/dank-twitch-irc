export interface Color {
  r: number;
  g: number;
  b: number;
}

function toPaddedHex(index: number, shouldBeLength: number): string {
  return index.toString(16).padStart(shouldBeLength, "0");
}

/**
 * Make a hexadecimal color string (like e.g. #AABBCC) from a given color object.
 */
export function colorToHexString(color: Color): string {
  return `#${toPaddedHex(color.r, 2)}${toPaddedHex(
    color.g,
    2,
  )}${toPaddedHex(color.b, 2)}`;
}
