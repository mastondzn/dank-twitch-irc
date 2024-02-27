export class BaseError extends Error {
  public constructor(message: string, cause?: Error | undefined) {
    super(message, { ...(cause ? { cause } : {}) });
  }
}
