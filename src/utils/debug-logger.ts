export function isFlagEnabled(
  flag: string,
  scopes = process.env.DEBUG,
): boolean {
  for (const variable of scopes?.split(/[\s,]+/) ?? []) {
    const pattern = variable.replace("*", ".*?");

    if (variable.startsWith("-")) {
      if (new RegExp(`^${pattern.slice(1)}$`).test(flag)) {
        return false;
      }
      continue;
    }

    if (new RegExp(`^${pattern}$`).test(flag)) {
      return true;
    }
  }

  return false;
}

const levels = ["debug", "info", "warn", "error"] as const;

export function debugLogger(scope: string) {
  return Object.fromEntries(
    levels.map((level) => {
      return [
        level,
        (...args: unknown[]) => {
          if (!isFlagEnabled(scope)) return;
          // eslint-disable-next-line no-console
          console[level](scope, ...args);
        },
      ];
    }),
  ) as Record<(typeof levels)[number], (...args: unknown[]) => void>;
}
