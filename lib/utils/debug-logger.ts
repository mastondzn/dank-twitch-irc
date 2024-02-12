import type { InspectOptions } from "node:util";

// @ts-expect-error debug-logger is not typed
import unTypedLogger from "debug-logger";

export const debugLogger = unTypedLogger as (namespace: string) => Logger;

/**
 * A single log function at a determined log namespace and level, e.g. <code>my-app:info</code>.
 */
export interface LogFunction {
  /**
   * Outputs the message using the root/default debug instance, without the level suffix.
   * @param args Arguments to format
   */
  (...arguments_: unknown[]): void;

  /**
   * Numerical level value, e.g. <code>0</code> for <code>trace</code>,
   * and <code>5</code> for <code>error</code>.
   */
  level: number;

  /**
   * A string of shell escape codes to activate this logger's color.
   */
  color: string;

  /**
   * A string of shell escape codes to deactivate this logger's color.
   */
  reset: string;

  /**
   * Shell escape code used to specially highlight the beginning of inspected objects.
   *
   * Defaults to underline (see {@link debugLogger#styles}).
   */
  inspectionHighlight: string;

  /**
   * Boolean indicating if level's logger is enabled.
   */
  enabled(): boolean;
}

/**
 * A single debug logger created with a namespace, e.g. by <code>require('debug-logger')('my-app')</code>.
 */
export type Logger = {
  /**
   * Minimum log level that is actually output.
   * <code>0</code> (i.e. <code>trace</code>) by default,
   * Setting the <code>DEBUG_LEVEL</code> environment variable
   * will increase this number.
   */
  logLevel: number;

  /**
   * Storage for start times recorded by {@link Logger#time time()} invocations.
   */
  timeLabels: Record<string, [number, number]>;

  /**
   * Mark the beginning of a time difference measurement.
   * @param label string label
   */
  time(label: string): void;

  /**
   * Finish timer, record output. level will determine the logger used to output the result
   * (defaults to 'log'). Returns duration in ms.
   * @param label Label used in call to {@link Logger#time time()}.
   * @param level Level to determine the logger to output the logged message on.
   */
  timeEnd(label: string, level?: string): number;

  /**
   * Inspect <code>obj</code>.
   *
   * @param obj The object to inspect.
   * @param level Optional log level, e.g. "warn".
   */
  dir(object: unknown, level?: string): void;

  /**
   * Inspect <code>obj</code>.
   *
   * @param obj The object to inspect.
   * @param options Options passed to <code>util.inspect()</code>
   * @param level Optional log level, e.g. "warn".
   */
  dir(object: unknown, options?: InspectOptions, level?: string): void;

  /**
   * Similar to <code>console.assert()</code>.
   * Additionally it outputs the error using the appropriate logger set by level (defaults to 'error').
   * @param expression boolean expresion to test
   * @param message Optional message to format <code>AssertionError</code> with.
   * @param formatArgs arguments passed to <code>util.format</code> to format the given
   * <code>message</code>.
   */
  assert(
    expression: boolean,
    message?: string,
    ...formatArguments: unknown[]
  ): void;

  /**
   * Similar to <code>console.assert()</code>.
   * Additionally it outputs the error using the appropriate logger set by level (defaults to 'error').
   * @param expression boolean expresion to test
   * @param message Optional message to format <code>AssertionError</code> with.
   * @param formatArg1 argument passed to <code>util.format</code> to format the given
   * <code>message</code>.
   * @param level Chooses to logger to output message with, <code>error</code> by default.
   */
  assert(
    expression: boolean,
    message: string,
    formatArgument1: unknown,
    level: string,
  ): void;
  assert(
    expression: boolean,
    message: string,
    formatArgument1: unknown,
    formatArgument2: unknown,
    level: string,
  ): void;
  assert(
    expression: boolean,
    message: string,
    formatArgument1: unknown,
    formatArgument2: unknown,
    formatArgument3: unknown,
    level: string,
  ): void;
  assert(
    expression: boolean,
    message: string,
    formatArgument1: unknown,
    formatArgument2: unknown,
    formatArgument3: unknown,
    formatArgument4: unknown,
    level: string,
  ): void;
  assert(
    expression: boolean,
    message: string,
    formatArgument1: unknown,
    formatArgument2: unknown,
    formatArgument3: unknown,
    formatArgument4: unknown,
    formatArgument5: unknown,
    level: string,
  ): void;
  assert(
    expression: boolean,
    message: string,
    formatArgument1: unknown,
    formatArgument2: unknown,
    formatArgument3: unknown,
    formatArgument4: unknown,
    formatArgument5: unknown,
    formatArgument6: unknown,
    level: string,
  ): void;
  assert(
    expression: boolean,
    message: string,
    formatArgument1: unknown,
    formatArgument2: unknown,
    formatArgument3: unknown,
    formatArgument4: unknown,
    formatArgument5: unknown,
    formatArgument6: unknown,
    formatArgument7: unknown,
    level: string,
  ): void;
  assert(
    expression: boolean,
    message: string,
    formatArgument1: unknown,
    formatArgument2: unknown,
    formatArgument3: unknown,
    formatArgument4: unknown,
    formatArgument5: unknown,
    formatArgument6: unknown,
    formatArgument7: unknown,
    formatArgument8: unknown,
    level: string,
  ): void;
  assert(
    expression: boolean,
    message: string,
    formatArgument1: unknown,
    formatArgument2: unknown,
    formatArgument3: unknown,
    formatArgument4: unknown,
    formatArgument5: unknown,
    formatArgument6: unknown,
    formatArgument7: unknown,
    formatArgument8: unknown,
    formatArgument9: unknown,
    level: string,
  ): void;
} & {
  trace: LogFunction;
  warn: LogFunction;
  debug: LogFunction;
};

/**
 * Configures what logging levels are available and their properties
 */
export type Levels = Record<
  string,
  {
    /**
     * A string of shell escape codes to activate this level's color.
     */
    color: string;

    /**
     * A string of shell escape codes to deactivate this level's color.
     */
    prefix: string;

    /**
     * namespace suffix to append to the base namespace of the {@link Logger}, e.g.
     * <code>:trace</code>
     */
    namespaceSuffix: string;

    /**
     * Numeric level, e.g <code>0</code> for <code>trace</code> or <code>5</code> for <code>error</code>.
     */
    level: number;

    /**
     * Specifies the file descriptor to send output to.
     * stderr (2) by default. Use 1 to specify stdout.
     */
    fd?: number;
  }
>;

/**
 * Configures the <code>debug-logger</code> instance.
 */
export interface DebugLoggerConfig {
  /**
   * Ensure that output from this module always beings after a newline on the terminal.
   * If you are using the console to output things not ending in a newline, e.g. progress bars,
   * and a logger function prints data while the console is not positioned on a new line,
   * <code>debug-logger</code> will insert a newline first to ensure a new line beings before log output
   * is printed.
   */
  ensureNewline?: boolean;

  /**
   * Specifies custom inspect options under use.
   */
  inspectOptions?: InspectOptions;

  /**
   * Configures what logging levels are available and their properties
   */
  levels?: Levels;
}
