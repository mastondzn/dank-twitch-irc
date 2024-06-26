import { defineConfig } from "@mastondzn/eslint";

// if you wish to see what this config adds
// you can run `pnpx eslint-flat-config-viewer`
export default defineConfig({
  stylistic: false,
  typescript: {
    tsconfigPath: ["./tsconfig.json"],
  },

  rules: {
    "unicorn/prevent-abbreviations": "off",
  },
});
