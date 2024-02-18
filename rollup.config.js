import typescript from "@rollup/plugin-typescript";
import { defineConfig } from "rollup";

export default defineConfig({
  input: "lib/index.ts",
  output: [
    { file: "dist/index.cjs", sourcemap: true, format: "cjs" },
    { file: "dist/index.js", sourcemap: true, format: "esm" },
  ],
  plugins: [typescript()],
});
