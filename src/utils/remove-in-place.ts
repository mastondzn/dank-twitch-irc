export function removeInPlace<T>(array: T[], element: T): void {
  let index;
  // eslint-disable-next-line no-cond-assign
  while ((index = array.indexOf(element)) !== -1) {
    array.splice(index, 1);
  }
}
