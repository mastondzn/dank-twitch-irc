import { assert, beforeEach, describe, expect, it, vi } from "vitest";

import { EditableTimeout } from "~/utils/editable-timeout";

beforeEach(() => {
  vi.useFakeTimers({ now: 5000 });
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
      const callback = vi.fn();
      const timeout = new EditableTimeout(callback, 1234);

      vi.advanceTimersByTime(1233);
      expect(callback).not.toHaveBeenCalled();
      expect(timeout.completed).toBe(false);

      vi.advanceTimersByTime(1);
      expect(callback).toHaveBeenCalled();
      expect(timeout.completed).toBe(true);
    });

    it("should be stoppable", () => {
      const callback = vi.fn();
      const timeout = new EditableTimeout(callback, 1234);

      vi.advanceTimersByTime(1233);
      expect(callback).not.toHaveBeenCalled();
      expect(timeout.completed).toBe(false);

      timeout.stop();
      vi.advanceTimersByTime(1);
      expect(callback).not.toHaveBeenCalled();
      expect(timeout.completed).toBe(false);

      vi.advanceTimersByTime(1_000_000);
      expect(callback).not.toHaveBeenCalled();
      expect(timeout.completed).toBe(false);
    });

    it("should do nothing if stop is called after timeout is completed", () => {
      const callback = vi.fn();
      const timeout = new EditableTimeout(callback, 1234);

      vi.advanceTimersByTime(1234);
      expect(callback).toHaveBeenCalledOnce();
      expect(timeout.completed).toBe(true);

      timeout.stop();
      expect(callback).toHaveBeenCalledOnce();
      expect(timeout.completed).toBe(true);
    });

    it("should be possible to update the remaining run time", () => {
      const callback = vi.fn();
      const timeout = new EditableTimeout(callback, 2000);

      vi.advanceTimersByTime(1000);
      expect(callback).not.toHaveBeenCalled();
      expect(timeout.completed).toBe(false);

      timeout.update(1500);
      expect(callback).not.toHaveBeenCalled();
      expect(timeout.completed).toBe(false);

      vi.advanceTimersByTime(499);
      expect(callback).not.toHaveBeenCalled();
      expect(timeout.completed).toBe(false);

      vi.advanceTimersByTime(1);
      expect(callback).toHaveBeenCalled();
      expect(timeout.completed).toBe(true);
    });

    it("should do nothing if update is called after timeout is completed", () => {
      const callback = vi.fn();
      const timeout = new EditableTimeout(callback, 1000);

      vi.advanceTimersByTime(999);
      expect(callback).not.toHaveBeenCalled();
      expect(timeout.completed).toBe(false);

      vi.advanceTimersByTime(1);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(timeout.completed).toBe(true);

      timeout.update(2000);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(timeout.completed).toBe(true);

      vi.advanceTimersByTime(1000);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(timeout.completed).toBe(true);
    });
  });
});
