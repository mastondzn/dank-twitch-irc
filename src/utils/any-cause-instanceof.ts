export function causeOf(error: Error): Error | undefined {
  if (error instanceof Error) {
    return error.cause as Error | undefined;
  }
  return undefined;
}

export function anyCauseInstanceof(
  error: Error | undefined,
  // eslint-disable-next-line ts/no-explicit-any
  constructor: any,
): boolean {
  let currentError: Error | undefined = error;

  while (currentError != null) {
    if (currentError instanceof constructor) {
      return true;
    }
    currentError = causeOf(currentError);
  }

  return false;
}
