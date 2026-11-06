export interface Transport {
  /**
   * Incoming data from the server. Text chunks are used as-is; byte chunks are
   * decoded as UTF-8 by the client.
   */
  readonly readable: ReadableStream<Uint8Array | string>;

  /**
   * Starts connecting. The listener is invoked once the transport is ready to
   * send data.
   */
  connect: (connectionListener?: () => void) => void;

  /**
   * Queues text for sending. This may be called before {@link connect}.
   */
  write: (data: string) => void;

  /**
   * Closes the transport. If an error is given, {@link readable} is errored
   * with it; otherwise it is closed.
   */
  destroy: (error?: Error) => void;
}
