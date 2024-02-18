/* eslint-disable ts/no-explicit-any */
export type SomeFunction = (...args: unknown[]) => unknown;

export type OverrideFunction<
  S,
  T extends Record<string, any>,
  K extends keyof T,
> = (this: S, oldFunction: T[K], ...args: Parameters<T[K]>) => ReturnType<T[K]>;

export function applyReplacement<
  S,
  T extends Record<string, any>,
  K extends keyof T,
>(self: S, target: T, key: K, newFunction: OverrideFunction<S, T, K>): void {
  const oldFunction: T[K] = Reflect.get(target, key);

  // build a new replacement function that is called instead of
  // the original function
  // it then purely delegates to "newFn", except the first parameter
  // is additionally the old function.
  function replacementFunction(
    this: T,
    ...args: Parameters<typeof oldFunction>
  ): ReturnType<typeof oldFunction> {
    // eslint-disable-next-line ts/no-unsafe-return, ts/no-unsafe-argument, ts/no-unsafe-call
    return newFunction.call(self, oldFunction.bind(this), ...args);
  }

  // define the new fn as not enumerable
  Object.defineProperty(target, key, {
    value: replacementFunction,
    writable: true,
    enumerable: false,
    configurable: true,
  });
}

export type OverrideFunctions<S, T extends Record<string, any>> = {
  [K in keyof T as T[K] extends (...args: any) => any
    ? K
    : never]?: OverrideFunction<S, T, K>;
};

export function applyReplacements<S, T extends Record<string, any>>(
  self: S,
  target: T,
  replacements: OverrideFunctions<S, T>,
): void {
  for (const [key, newFunction] of Object.entries(replacements)) {
    // eslint-disable-next-line ts/no-unsafe-argument
    applyReplacement(self, target, key as any, newFunction as any);
  }
}
