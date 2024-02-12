import { afterEach, assert, beforeEach, describe, it, vi } from "vitest";

import { EditableTimeout } from "./editable-timeout";

beforeEach(() => {
  vi.useFakeTimers({ now: 5000 });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("./utils/editable-timeout", () => {
  describe("editableTimeout", () => {
    it("should capture run time and current time at creation", () => {
      // eslint-disable-next-line ts/no-empty-function
      const timeout = new EditableTimeout(() => {}, 1234);
      assert.strictEqual(timeout.startTime, 5000);
      assert.strictEqual(timeout.runTime, 1234);
    });

    it("should run the callback after `runTime` if not edited", () => {
      let wasHit = false;
      const timeout = new EditableTimeout(() => {
        wasHit = true;
      }, 1234);

      vi.advanceTimersByTime(1233);
      assert.isFalse(wasHit);
      assert.isFalse(timeout.completed);

      vi.advanceTimersByTime(1);
      assert.isTrue(wasHit);
      assert.isTrue(timeout.completed);
    });

    it("should be stoppable", () => {
      let wasHit = false;
      const timeout = new EditableTimeout(() => {
        wasHit = true;
      }, 1234);

      vi.advanceTimersByTime(1233);
      assert.isFalse(wasHit);
      assert.isFalse(timeout.completed);

      timeout.stop();
      vi.advanceTimersByTime(1);
      assert.isFalse(wasHit);
      assert.isFalse(timeout.completed);

      vi.advanceTimersByTime(1_000_000);
      assert.isFalse(wasHit);
      assert.isFalse(timeout.completed);
    });

    it("should do nothing if stop is called after timeout is completed", () => {
      let wasHit = false;
      const timeout = new EditableTimeout(() => {
        wasHit = true;
      }, 1234);

      vi.advanceTimersByTime(1234);
      assert.isTrue(wasHit);
      assert.isTrue(timeout.completed);

      timeout.stop();
      assert.isTrue(wasHit);
      assert.isTrue(timeout.completed);
    });

    it("should be possible to update the remaining run time", () => {
      let wasHit = false;
      const timeout = new EditableTimeout(() => {
        wasHit = true;
      }, 2000);

      vi.advanceTimersByTime(1000);
      assert.isFalse(wasHit);
      assert.isFalse(timeout.completed);

      timeout.update(1500);
      assert.isFalse(wasHit);
      assert.isFalse(timeout.completed);

      vi.advanceTimersByTime(499);
      assert.isFalse(wasHit);
      assert.isFalse(timeout.completed);

      vi.advanceTimersByTime(1);
      assert.isTrue(wasHit);
      assert.isTrue(timeout.completed);
    });

    it("should do nothing if update is called after timeout is completed", () => {
      let hitCount = 0;
      const timeout = new EditableTimeout(() => {
        hitCount += 1;
      }, 1000);

      vi.advanceTimersByTime(999);
      assert.strictEqual(hitCount, 0);
      assert.isFalse(timeout.completed);

      vi.advanceTimersByTime(1);
      assert.strictEqual(hitCount, 1);
      assert.isTrue(timeout.completed);

      timeout.update(2000);
      assert.strictEqual(hitCount, 1);
      assert.isTrue(timeout.completed);

      vi.advanceTimersByTime(1000);
      assert.strictEqual(hitCount, 1);
      assert.isTrue(timeout.completed);
    });
  });
});
