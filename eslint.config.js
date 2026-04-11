import { maston } from "@mastondzn/eslint";

// if you wish to see what this config adds
// you can run `pnpm eslint --inspect-config`
export default maston(
  {
    typescript: {
      projectService: true,
      tsconfigRootDir: import.meta.dirname,
    },
  },
  {
    rules: {
      "no-dupe-keys": "off",
      "ts/no-non-null-assertion": "warn",
    },
  },
);
