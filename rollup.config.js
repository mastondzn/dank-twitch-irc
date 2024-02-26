import typescript from "@rollup/plugin-typescript";
import { defineConfig } from "rollup";

/** @type {import("typescript-transform-paths").default} */
const paths = (await import("typescript-transform-paths")).default.default;
// "typescript-transform-paths" has a broken default export

export default defineConfig({
  input: "src/index.ts",
  output: [
    { file: "dist/index.cjs", sourcemap: true, format: "cjs" },
    { file: "dist/index.js", sourcemap: true, format: "esm" },
  ],
  plugins: [
    typescript({
      exclude: ["./tests/**"],
      transformers: {
        before: [{ type: "program", factory: paths }],
        afterDeclarations: [{ type: "program", factory: paths }],
      },
    }),
  ],
});
