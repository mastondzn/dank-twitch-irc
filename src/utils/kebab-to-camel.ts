export function kebabToCamelCase(str: string): string {
  return str.replaceAll(/-([a-z])/g, (g) => g[1]!.toUpperCase());
}
