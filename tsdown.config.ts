import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/index.ts", "./src/transports/node-tcp.ts"],
  root: "./src",
  outDir: "./dist",
  format: ["esm"],
  unbundle: true,
  dts: true,
  sourcemap: true,
  target: "es2022",
  clean: true,
});
