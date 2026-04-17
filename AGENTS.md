# AGENTS.md

## Overview

`@mastondzn/dank-twitch-irc` — a TypeScript Twitch IRC client library for Node.js. Single package, no monorepo.

## Commands

```bash
pnpm install          # install deps
pnpm build            # tsdown build (src/index.ts -> dist/)
pnpm test             # vitest (interactive watch mode)
pnpm test --run       # vitest single run (CI mode)
pnpm test --coverage  # with v8 coverage
pnpm lint             # eslint
pnpm lint --fix       # auto-fix
pnpm lint --fix $FILE # auto-fix one file
pnpm typecheck        # tsc --noEmit
pnpm format           # prettier --write
pnpm format:check     # prettier --check
```

CI order: `format:check -> lint -> typecheck -> build -> test --coverage`

Single test: `pnpm test --run $FILE` (e.g. `pnpm test --run tests/client.test.ts`)

## Path aliases

`~/*` maps to `./src/*` (tsconfig paths + `vite-tsconfig-paths`). Use `~/client/client` not `../../client` in src and tests.

## Key files

- Entrypoint: `src/index.ts` — re-exports everything
- Tests root: `tests/` — mirrors `src/` structure
- Test setup: `tests/setup.ts` — auto-restores fake timers after each test
- Test helpers: `tests/helpers.ts` — `fakeClient()`, `fakeConnection()`, `createMockTransport()`, `assertErrorChain()`

## Testing patterns

- Use `fakeClient()` from `tests/helpers.ts` to create a `ChatClient` with a mock Duplex transport (no real IRC connection). Pass `false` to skip auto-connect.
- Use `fakeConnection()` for lower-level `SingleConnection` tests.
- Use `assertErrorChain()` to verify error cause chains.
- `vi.useFakeTimers()` is auto-cleaned up by the setup file — no manual `useRealTimers()` needed.

## TypeScript quirks

- `erasableSyntaxOnly: true` — do not use enums or parameter properties (`constructor(private x)`) that require runtime transform.
- `noUncheckedIndexedAccess: true` — array/object access returns `T | undefined`.
- Path alias `~/*` resolves at typecheck and test time; tsdown resolves these automatically at build-time.

## Style

- ESLint uses `@mastondzn/eslint` (flat config). A lot of rules are auto-fixable. Run `pnpm lint --fix $FILE` to apply.
- Prettier uses defaults (empty config).

## Docs

Docs are VitePress with typedoc. Generated via `pnpm docs:build`. Don't modify `.vitepress/typedoc/` manually.
