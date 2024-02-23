import { defaultExclude, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: [
      ...defaultExclude,
      "./lib/utils/helpers.spec.ts",
      "./lib/utils/setup.spec.ts",
    ],
    setupFiles: ["./lib/utils/setup.spec.ts"],
    coverage: {
      reporter: ["text", "json", "json-summary"],
      reportOnFailure: true,
    },
  },
});
