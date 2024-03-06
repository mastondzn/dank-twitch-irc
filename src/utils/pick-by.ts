export function pickBy<T extends Record<string, unknown>>(
  object: T,
  predicate: (arg: T[keyof T]) => unknown,
): Partial<T> {
  const obj: Partial<T> = {};
  for (const key in object) {
    if (predicate(object[key])) {
      obj[key] = object[key];
    }
  }
  return obj;
}
