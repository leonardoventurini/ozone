# Explicit Cypress Binary Install

Date: 2026-07-09

## Decision

The Cypress CI workflow installs the Cypress desktop binary explicitly after
`yarn install` and before `yarn build`.

The install step uses Cypress's package entrypoint:

```sh
node node_modules/cypress/dist/index.js --exec install
```

## Rationale

The workflow passes `install: false` to `cypress-io/github-action` because the
repository already installs dependencies earlier in the job. That is correct
for `node_modules`, but it does not guarantee the separate Cypress binary is
present when package lifecycle scripts are disabled.

The failed CI run installed `cypress@15.17.0` but skipped the package build
script that normally downloads the desktop binary. The action then failed
before running any E2E spec because `~/.cache/Cypress/15.17.0` was missing.

Running the package installer explicitly preserves disabled lifecycle scripts
while making the Cypress binary requirement visible in the workflow.

## Consequences

- Cypress E2E and component jobs no longer depend on postinstall side effects.
- The workflow still avoids a second dependency install inside
  `cypress-io/github-action`.
- The local `e2e:run` script uses the Cypress binary directly so Yarn 4 does
  not expand the legacy `$(yarn bin)` output into an invalid path.

## Verification

- `node node_modules/cypress/dist/index.js --exec install`
- `node node_modules/cypress/dist/index.js --exec verify`
- `"$(corepack yarn bin cypress)" run --component --browser chrome`
- `corepack yarn build`
- `corepack yarn lint`
- `corepack yarn type-check`
- `corepack yarn test:unit`
