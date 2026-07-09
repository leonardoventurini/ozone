# ESLint 9 Flat Config For CI Lint

Date: 2026-07-09

## Decision

Ozone uses an ESLint 9 flat config as the authoritative lint configuration.
The root lint script runs the ESLint CLI directly instead of `next lint`, and
the GitHub lint reporter checks JavaScript and TypeScript extensions.

The flat config preserves the existing Next core-web-vitals rules,
`useSignaledEffect` hook dependency handling, and Cypress lint rules.

## Rationale

The `wearerequired/lint-action@v2.2.0` reporter invokes raw ESLint with JSON
output. After the dependency audit merge upgraded the repo to `eslint@9.39.4`,
that raw invocation failed before linting because ESLint 9 looks for
`eslint.config.*` by default and the repo still had only `.eslintrc.json`.

`next lint` still passed because Next's deprecated wrapper kept legacy config
loading alive, but that made the local lint script and reporter use different
configuration paths. Using the ESLint CLI directly removes that split and
prepares the repo for Next 16, where `next lint` is removed.

## Consequences

- CI lint reporter output is valid ESLint JSON again.
- The reporter now includes TS/TSX files instead of the action's default `js`
  extension only.
- Cypress specs now avoid fixed numeric waits and unsafe chained commands so
  the expanded lint surface stays green.
- Existing product lint warnings remain warnings and do not block CI.

## Verification

- `corepack yarn lint`
- `corepack yarn run --silent eslint --ext .js,.jsx,.ts,.tsx,.mjs,.cjs --no-color --format json "."`
- `corepack yarn type-check`
- `corepack yarn test:unit`
- `git diff --check`
