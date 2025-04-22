import typescript from "@rollup/plugin-typescript";
import { defineConfig } from "rollup";
import paths from "typescript-transform-paths";

export default defineConfig({
  input: "src/index.ts",
  output: {
    format: "esm",
    entryFileNames: "[name].js",
    sourcemap: true,
    dir: "dist",
    preserveModules: true,
  },
  plugins: [
    typescript({
      include: ["./src/**"],
      transformers: {
        afterDeclarations: [{ type: "program", factory: paths.default }],
      },
    }),
  ],
});
