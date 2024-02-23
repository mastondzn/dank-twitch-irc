import { onTestFinished, vi } from "vitest";

const useFakeTimers = vi.useFakeTimers.bind(vi);
vi.useFakeTimers = (options: Parameters<typeof vi.useFakeTimers>[0]) => {
  useFakeTimers(options);
  onTestFinished(() => void vi.useRealTimers());
  return vi;
};
