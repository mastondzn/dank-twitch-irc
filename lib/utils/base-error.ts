export class BaseError extends Error {
  public constructor(message?: string, cause?: Error | undefined) {
    let newMessage;
    if (message != null && cause?.message != null && cause.message.length > 0) {
      newMessage = `${message}: ${cause.message}`;
    } else if (message != null) {
      newMessage = message;
    } else if (cause?.message == null) {
      newMessage = "";
    } else {
      newMessage = cause.message;
    }

    super(newMessage, { cause });
  }
}
