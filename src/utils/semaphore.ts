/**
 * A small FIFO semaphore with the same acquire/release semantics used by the
 * rate limiters. This avoids a dependency on Node-specific event emitters.
 */
export class Semaphore {
  private available: number;
  private readonly waiters: (() => void)[] = [];

  public constructor(limit: number) {
    this.available = limit;
  }

  public async acquire(): Promise<void> {
    if (this.available > 0) {
      this.available--;
      return;
    }

    await new Promise<void>((resolve) => {
      this.waiters.push(resolve);
    });
  }

  public release(): void {
    const next = this.waiters.shift();
    if (next == null) {
      this.available++;
    } else {
      next();
    }
  }

  /**
   * Number of acquirers currently waiting for the semaphore.
   */
  public nrWaiting(): number {
    return this.waiters.length;
  }
}
