export class BaseError extends Error {
  public constructor(message: string, cause?: Error) {
    super(message, { ...(cause ? { cause } : {}) });
  }
}
