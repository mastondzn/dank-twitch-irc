import { describe, expect, it } from "vitest";

import { Semaphore } from "~/utils/semaphore";

describe("./utils/semaphore", () => {
  describe("semaphore", () => {
    it("should allow up to the configured limit immediately", async () => {
      const semaphore = new Semaphore(2);

      await semaphore.acquire();
      await semaphore.acquire();

      expect(semaphore.nrWaiting()).toBe(0);
    });

    it("should queue acquisitions and release them in FIFO order", async () => {
      const semaphore = new Semaphore(1);
      const order: number[] = [];

      await semaphore.acquire();

      const second = (async (): Promise<void> => {
        await semaphore.acquire();
        order.push(2);
      })();
      const third = (async (): Promise<void> => {
        await semaphore.acquire();
        order.push(3);
      })();

      expect(semaphore.nrWaiting()).toBe(2);

      semaphore.release();
      await second;
      expect(order).toEqual([2]);

      semaphore.release();
      await third;
      expect(order).toEqual([2, 3]);
    });

    it("should increase available permits when released with no waiters", async () => {
      const semaphore = new Semaphore(1);

      await semaphore.acquire();
      semaphore.release();

      await expect(semaphore.acquire()).resolves.toBeUndefined();
    });
  });
});
