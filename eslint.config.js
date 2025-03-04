import { maston } from "@mastondzn/eslint";

// if you wish to see what this config adds
// you can run `pnpx eslint-flat-config-viewer`
export default maston(
  {
    typescript: {
      projectService: true,
      tsconfigRootDir: import.meta.dirname,
    },
    javascript: {
      overrides: {
        "no-dupe-keys": "off",
      },
    },
  },
  {
    rules: {
      "ts/no-non-null-assertion": "warn",
    },
  },
);
