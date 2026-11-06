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
  {
    files: ["src/**/*.ts"],
    ignores: ["src/transports/node-tcp.ts"],
    rules: {
      "no-restricted-globals": [
        "error",
        {
          name: "process",
          message:
            "The core package must stay platform agnostic. Guard globalThis.process instead.",
        },
        {
          name: "Buffer",
          message:
            "The core package must stay platform agnostic. Use Uint8Array instead.",
        },
        {
          name: "setImmediate",
          message:
            "The core package must stay platform agnostic. Use setTimeout or queueMicrotask instead.",
        },
        {
          name: "global",
          message: "Use globalThis instead.",
        },
      ],
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "node:*",
                "stream",
                "stream/*",
                "net",
                "tls",
                "readline",
                "fs",
                "fs/*",
                "util",
                "events",
                "buffer",
                "os",
                "path",
                "crypto",
                "http",
                "https",
                "zlib",
                "child_process",
                "worker_threads",
              ],
              message:
                "The core package must stay platform agnostic. Node.js-only code belongs in a transports subpath.",
            },
          ],
        },
      ],
    },
  },
);
