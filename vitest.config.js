import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      reporter: ["text-summary", "json", "json-summary"],
      reportOnFailure: true,
    },
    include: ["./tests/**/*.test.ts"],
  },
  resolve: {
    tsconfigPaths: true,
  },
});
