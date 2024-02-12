function findByPredicate<T>(
  array: T[],
  filter: (t: T) => boolean,
): { index: number; value: T } | undefined {
  for (const [index, value] of array.entries()) {
    if (filter(value)) {
      return { index, value };
    }
  }

  return undefined;
}

export function findAndPushToEnd<T>(
  array: T[],
  filter: (t: T) => boolean,
): T | undefined {
  const result = findByPredicate(array, filter);
  if (result == null) {
    return undefined;
  }

  const { index, value } = result;

  array.splice(index, 1);
  array.push(value);

  return value;
}
