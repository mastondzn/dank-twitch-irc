import { defaultExclude, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: [
      ...defaultExclude,
      "./src/utils/helpers.spec.ts",
      "./src/utils/setup.spec.ts",
    ],
    setupFiles: ["./src/utils/setup.spec.ts"],
    coverage: {
      reporter: ["text-summary", "json", "json-summary"],
      reportOnFailure: true,
    },
  },
});
