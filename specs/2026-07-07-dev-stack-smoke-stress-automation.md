# Dev Stack Smoke and Stress Automation - Campaign Plan

> For agentic workers: this is a direct-rollout implementation plan. Execute it
> end to end in the current session when asked to implement it; do not split it
> into phased PRs unless a concrete blocker requires that.

**Goal:** Design a repeatable automation layer for the Docker Compose local
Ozone plus atproto dev stack that can run readiness checks, live API smoke
checks, browser smoke checks, synthetic AT Protocol workload checks, and bounded
stress checks without polluting the sibling `atproto` checkout.
**Cynefin classification:** Complicated.
**Intensity tier:** Raid - cross-service dev workflow with Compose overlays,
browser automation, authenticated XRPC traffic, synthetic protocol data, and
performance thresholds.
**RFC mode:** internal. Subagent tooling was not exposed in this session.
**Delegation profile:** local only.
**Model/cost profile:** inherit by default; no subagent lanes.
**Cortex context:** unavailable in this session; targeted local reads and
official external references were used instead.
**Architecture:** Keep `compose.dev.yaml` as the default interactive developer
stack. Add an optional `compose.automation.yaml` overlay that contributes
one-shot runner services and an automation-only Ozone UI instance for
containerized browser tests. Generated test data is tagged by run ID and all
artifacts land under `.dev-stack/runs/<run-id>`.
**Tech stack:** Docker Compose profiles and one-off runs, Node scripts, existing
Yarn/Cypress 14.3.0 test tooling, k6 for API load checks, atproto dev-env for
seed data and protocol services, Ozone XRPC endpoints.
**Parallelism profile:** sequential by default for diagnosis; k6 VUs can run in
parallel inside the stress lane after smoke gates pass.
**Design context source:** n/a.
**Repository context:** text search was sufficient; syntax-aware matching was
not load-bearing for this planning artifact.

**Shadow Team Assignments:**
- Bellion [Strategist]: direct-rollout plan integrity and done criteria.
- Beru [Auditor->Executor]: local Compose and dev-env reconnaissance.
- Kamish [Architect]: runner topology, URLs, and service contracts.
- Greed [Executor]: Makefile, Compose overlay, and automation script shape.
- Fangs [Auditor]: verification ladder, thresholds, and artifact contracts.
- Tank [Auditor]: isolation, cleanup, and sibling-checkout safety.
- Igris [Executor]: documentation quality and future implementation task shape.
- Munger [Strategist]: inversion pass for false-green and state-pollution risks.

## Answer

Yes. The right mechanism is an optional automation overlay, not more behavior in
the always-on dev stack.

The base `compose.dev.yaml` should remain optimized for interactive work:
Postgres, Redis, the atproto dev-env process, and the host-facing Ozone UI. The
automation layer should be activated only by explicit Make targets and should
add:

- `ozone-api-runner`: one-shot Node checks for live Ozone and PDS XRPC flows.
- `atproto-workload-runner`: one-shot Node checks for synthetic account, post,
  report, and firehose behavior, using atproto dependencies from the isolated
  Docker workdir volume.
- `k6`: one-shot API stress checks with explicit thresholds.
- `ozone-ui-automation`: automation-only Next dev server with
  `NEXT_PUBLIC_*` URLs pointed at Compose service DNS names.
- `cypress-live`: one-shot Cypress browser smoke checks against
  `ozone-ui-automation`.

The important design choice is the separate `ozone-ui-automation` service.
Containerized Cypress cannot safely drive the base `ozone-ui` service as-is
because the base UI is configured for a host browser and emits public URLs such
as `http://localhost:2587`. From a browser running inside another container,
`localhost` is the browser container, not the atproto dev-env service. The
automation UI keeps the production UI code path but swaps the public local URLs
to `http://atproto-dev-env:*` so the browser test runs wholly inside the Compose
network.

## Munger Memo

**Inversion:** The plan fails if it gives a green result while only proving that
ports answer HTTP, if it corrupts a developer's local sandbox without a reset
path, or if it writes generated atproto output into the sibling checkout.
**Incentive map:** Developers want a single command, but a single opaque command
can hide whether auth, Ozone proxying, moderation queues, the UI, or the
firehose is failing.
**Standard stupidities in play:** Overconfidence in `localhost`, false comfort
from readiness checks, unbounded load tests on a laptop, and accidental reuse of
fixture-backed Cypress tests as live integration tests.
**Circle of competence:** In - Compose services, Ozone UI auth paths, atproto
dev-env seed data, XRPC endpoints, and local scripts were inspected.
**Verdict:** Green. Implement as an optional overlay with separate smoke,
workload, and stress lanes, hard thresholds, JSON artifacts, and a reset-first
escape hatch.

## Clarity Pass

Daily development keeps using `make dev-stack-up` and `make dev-stack-smoke`.
When a developer wants stronger validation, they run an automation target. The
target starts or reuses the base stack, runs one-shot containers that log in as
seeded users, checks Ozone queues and reports, optionally creates run-tagged
fake accounts/posts/reports, optionally watches the firehose for those commits,
then runs a bounded k6 load profile and writes a compact report to
`.dev-stack/runs/<run-id>`.

Concrete example:

1. Developer runs `make dev-stack-automation-smoke`.
2. Compose validates the base stack is healthy.
3. `ozone-api-runner` signs in as `mod.test` through the PDS and calls Ozone via
   the PDS proxy header.
4. `ozone-ui-automation` starts with container-resolvable public URLs.
5. `cypress-live` signs in through the UI and verifies the reports queue renders
   from the live stack.
6. The command prints the run ID and report path.

## Research Brief

Official references used for the automation design:

- Docker Compose profiles allow optional service groups for different
  workflows: <https://docs.docker.com/compose/how-tos/profiles/>
- Docker Compose startup-order docs describe `depends_on` conditions such as
  waiting for a service to be healthy:
  <https://docs.docker.com/compose/how-tos/startup-order/>
- Docker Compose one-off `run` commands execute a service command with Compose
  configuration and dependencies:
  <https://docs.docker.com/reference/cli/docker/compose/run/>
- k6 documents local and Docker execution plus scenarios and thresholds for
  load tests: <https://grafana.com/docs/k6/latest/get-started/running-k6/>
- Cypress documents the `cypress run` command-line workflow for headless test
  execution: <https://docs.cypress.io/guides/guides/command-line>
- Node's built-in test runner can provide dependency-light TAP-style checks for
  future script hardening: <https://nodejs.org/api/test.html>
- The AT Protocol streaming guide describes the repo event stream shape and
  links firehose consumers to the sync stream:
  <https://atproto.com/guides/streaming-data>
- The AT Protocol sync specification defines repository sync endpoints and the
  event-stream protocol surface:
  <https://atproto.com/specs/sync>

Local source evidence:

- `compose.dev.yaml` already owns Postgres, Redis, `atproto-dev-env`, and
  `ozone-ui`, with healthchecks and named volumes.
- `scripts/dev-stack/smoke.sh` verifies host reachability for introspection,
  PLC, PDS, AppView, Ozone, metadata, and UI.
- `Makefile` already exposes `dev-stack-check`, `dev-stack-up`,
  `dev-stack-down`, `dev-stack-logs`, `dev-stack-smoke`, and
  `dev-stack-reset`.
- `docker/dev/atproto.Dockerfile` provides Node 24, pnpm 11.5.2, Postgres and
  Redis clients, `jq`, `rsync`, and `gosu`.
- `docker/dev/ozone-ui.Dockerfile` provides Node 20.11 and Yarn 4.8.1, but no
  browser runtime.
- `scripts/dev-stack/atproto-entrypoint.sh` syncs `../atproto` into an isolated
  Docker workdir volume and never builds in the sibling checkout.
- `scripts/dev-stack/ozone-ui-entrypoint.sh` installs Ozone dependencies and
  waits for Ozone metadata before starting Next dev.
- `package.json` includes Cypress 14.3.0 and the existing `e2e:run` script.
- `cypress.config.ts` has no live-stack `baseUrl`, and existing Cypress specs
  are fixture/intercept oriented.
- `../atproto/packages/dev-env/src/bin.ts` starts PLC on `2582`, PDS on `2583`,
  AppView on `2584`, Ozone on `2587`, and introspection on `2581`.
- `../atproto/packages/dev-env/src/mock/index.ts` seeds `triage.test`,
  `mod.test`, and `admin-mod.test`, creates report queues, creates sample
  reports, and routes them into Ozone.
- `../atproto/packages/dev-env/package.json` depends on `@atproto/api` and
  `@atproto/sync`, which is useful for firehose-aware workload checks inside
  the isolated atproto workdir.
- `../atproto/packages/api/src/agent.ts` and
  `../atproto/packages/pds/src/pipethrough.ts` show that Ozone requests can be
  proxied through the PDS with `atproto-proxy: <ozoneDid>#atproto_labeler`.
- `docs/api.md` identifies `tools.ozone.moderation.queryStatuses` as the queue
  backing endpoint and `tools.ozone.moderation.queryEvents` as the historical
  event endpoint.

## Proposed Architecture

### Compose Overlay

Create `compose.automation.yaml` and keep it out of the default `DEV_COMPOSE`
variable. Add a new Makefile variable:

```make
DEV_AUTOMATION_COMPOSE = $(DOCKER_COMPOSE) -f compose.dev.yaml -f compose.automation.yaml
```

Use Compose profiles so automation services do not appear during a normal
`make dev-stack-up`:

- profile `automation-smoke`: `ozone-api-runner`, `ozone-ui-automation`,
  `cypress-live`.
- profile `automation-workload`: `atproto-workload-runner`.
- profile `automation-stress`: `k6`.

All one-shot services should have `restart: "no"` and depend on the healthy
base services they exercise. Runner services should mount this repo read-only
except for `.dev-stack/runs`, and they should mount `../atproto` read-only
only when they need the source tree for metadata. No runner may mount the
sibling atproto checkout read-write.

### Services

`ozone-api-runner`

- Build from `docker/dev/ozone-ui.Dockerfile` to reuse Node 20 and Yarn 4.8.1.
- Mount this repo at `/workspace/ozone:ro`.
- Reuse `ozone_node_modules` so `@atproto/api` is available after the UI
  service has installed dependencies.
- Write artifacts to `.dev-stack/runs/<run-id>`.
- Command:
  `node scripts/dev-stack/automation/ozone-live-smoke.mjs`.
- Responsibilities:
  - Read introspection from `http://atproto-dev-env:2581/`.
  - Create a PDS session for `mod.test` / `mod-pass`.
  - Call `tools.ozone.server.getConfig`.
  - Call `tools.ozone.moderation.queryStatuses`.
  - Call `tools.ozone.report.queryReports`.
  - Fail if seeded queues or seeded reports are absent.

`ozone-ui-automation`

- Build from `docker/dev/ozone-ui.Dockerfile`.
- Use the same Ozone source mount and `ozone_node_modules` volume as the base
  UI, but a separate `.next` volume such as `ozone_automation_next`.
- Set public URLs to Compose DNS names:
  - `NEXT_PUBLIC_OZONE_PUBLIC_URL=http://atproto-dev-env:2587`
  - `NEXT_PUBLIC_PLC_DIRECTORY_URL=http://atproto-dev-env:2582`
  - `NEXT_PUBLIC_SOCIAL_APP_URL=http://atproto-dev-env:2584`
  - `NEXT_PUBLIC_HANDLE_RESOLVER_URL=http://atproto-dev-env:2584`
- Do not publish a host port by default; Cypress reaches it on the Compose
  network.
- Reason: a browser inside a container cannot use the host-oriented
  `localhost` public URLs from the base `ozone-ui` service.

`cypress-live`

- Use a Cypress image pinned to Cypress 14.3.0, matching this repository's
  `package.json`, or a small `docker/dev/cypress.Dockerfile` that installs
  Chrome/Electron and prepares Yarn 4.8.1.
- Mount this repo read-only plus `.dev-stack/runs/<run-id>` write access.
- Run only live specs:
  `cypress run --browser electron --config baseUrl=http://ozone-ui-automation:3000 --spec "cypress/e2e/live/**/*.cy.ts"`.
- The live specs must not reuse fixture-only login helpers that intercept auth.
  They must sign in through the UI with `http://atproto-dev-env:2583`,
  `mod.test`, and `mod-pass`.

`atproto-workload-runner`

- Build from `docker/dev/atproto.Dockerfile` to reuse Node 24 and pnpm 11.5.2.
- Mount this repo read-only.
- Reuse the isolated `atproto_workdir`, `atproto_node_modules`, and
  `atproto_pnpm_store` volumes.
- Do not rerun `pnpm install` or `pnpm build`; fail with a clear message if the
  atproto workdir has not been prepared by `atproto-dev-env`.
- Command:
  `node /workspace/ozone/scripts/dev-stack/automation/atproto-workload.mjs`.
- Resolve atproto-only libraries with `createRequire` rooted at
  `/workspace/atproto/packages/dev-env/package.json`, so `@atproto/sync` and
  workspace packages come from the isolated atproto volume rather than the
  sibling checkout.
- Responsibilities:
  - Generate a run ID such as `20260707T193000Z-a1b2c3`.
  - Create a bounded number of accounts:
    `stress-<run-id>-<index>.test`.
  - Create posts with text that includes the run ID.
  - Create reports against those accounts and records.
  - Subscribe to `com.atproto.sync.subscribeRepos` on the local PDS long enough
    to see commits for the created DIDs.
  - Verify Ozone sees the new reports through `queryReports` or
    `queryStatuses`.

`k6`

- Use `grafana/k6` pinned to an explicit version or digest in
  `compose.automation.yaml`; never use `latest`.
- Mount `scripts/dev-stack/k6` read-only and `.dev-stack/runs/<run-id>` for
  summaries.
- Run after live API smoke has passed.
- In `setup()`, fetch introspection, create a PDS session, and build the Ozone
  proxy header:
  `atproto-proxy: <ozoneDid>#atproto_labeler`.
- Exercise raw XRPC endpoints through the PDS:
  - `tools.ozone.server.getConfig`
  - `tools.ozone.moderation.queryStatuses`
  - `tools.ozone.report.queryReports`
  - optionally `com.atproto.moderation.createReport` in a write scenario
- Default thresholds:
  - HTTP request failure rate below 1%.
  - 95th percentile below 1000 ms for read-only smoke pressure.
  - No non-2xx Ozone proxy responses.
  - Synthetic write scenario disabled unless `DEV_STACK_STRESS_WRITES=1`.

### Artifact Contract

Ignore `.dev-stack/` in git and write one directory per run:

```text
.dev-stack/
  runs/
    20260707T193000Z-a1b2c3/
      summary.json
      ozone-live-smoke.json
      atproto-workload.json
      k6-summary.json
      cypress/
        screenshots/
        videos/
```

`summary.json` should be the stable machine-readable output:

```json
{
  "runId": "20260707T193000Z-a1b2c3",
  "startedAt": "2026-07-07T19:30:00.000Z",
  "gitSha": "a1b2c3d",
  "mode": "automation-smoke",
  "services": {
    "pds": "http://atproto-dev-env:2583",
    "ozone": "http://atproto-dev-env:2587",
    "ui": "http://ozone-ui-automation:3000"
  },
  "checks": [
    { "name": "queryStatuses", "status": "passed", "durationMs": 142 }
  ]
}
```

## Modes

`readiness`

- Existing `make dev-stack-smoke`.
- No mutation.
- Checks host-visible URLs and Ozone DID metadata.

`live-api-smoke`

- New `make dev-stack-automation-api-smoke`.
- No mutation beyond session creation.
- Validates auth, PDS proxying, Ozone config, Ozone reports, and Ozone queue
  status endpoints against seeded dev-env data.

`live-browser-smoke`

- New `make dev-stack-automation-browser-smoke`.
- No app-data mutation beyond session creation.
- Starts `ozone-ui-automation` and runs Cypress specs under `cypress/e2e/live/`.
- Tests live UI login and reports list rendering without Cypress network
  intercepts.

`workload-smoke`

- New `make dev-stack-automation-workload`.
- Mutates the sandbox by creating run-tagged accounts, posts, and reports.
- Verifies PDS, firehose, and Ozone queue/report visibility.
- Requires `make dev-stack-reset` for a fully clean database afterward.

`stress`

- New `make dev-stack-automation-stress`.
- Runs `live-api-smoke` first.
- Runs k6 with bounded defaults:
  - `DEV_STACK_STRESS_VUS ?= 5`
  - `DEV_STACK_STRESS_DURATION ?= 30s`
  - `DEV_STACK_STRESS_WRITES ?= 0`
- Fails if thresholds fail.
- Does not run unbounded soak tests on local laptops.

## Invariant Matrix

- Base stack remains usable without the automation overlay.
  - Enforcement: `make dev-stack-up` continues to use only `compose.dev.yaml`.
  - Detection: `docker compose -f compose.dev.yaml config` has no automation
    services.
- Automation never writes into the sibling `../atproto` checkout.
  - Enforcement: all atproto writes happen in `atproto_workdir` and related
    named volumes.
  - Detection: compare `git -C ../atproto status --short` before and after a
    workload run.
- Readiness and live smoke modes do not create fake accounts, posts, or
  reports.
  - Enforcement: synthetic writes live only in `workload` and write-enabled
    `stress`.
  - Detection: runner summaries include `mutatesData: false` for smoke modes.
- Synthetic workload data is explicitly run-tagged.
  - Enforcement: account handles, post text, report reasons, and artifacts
    include the run ID.
  - Detection: `atproto-workload.json` lists every created DID and URI.
- Browser smoke uses live network calls.
  - Enforcement: live specs do not call existing fixture-based `cy.login()`
    helpers or broad `cy.intercept()` auth mocks.
  - Detection: a live Cypress support guard fails if auth XRPC routes are
    intercepted.
- Stress runs have thresholds and finite duration.
  - Enforcement: k6 scripts define thresholds and read duration from bounded
    environment variables.
  - Detection: missing thresholds fail runner preflight.

## ADRs

### ADR-001: Use an optional Compose overlay

**Status:** Accepted.
**Date:** 2026-07-07.
**Decision:** Add `compose.automation.yaml` and explicit Make targets instead
of expanding the default dev stack.

**Reason:** The default stack should stay fast to understand and suitable for
interactive work. Automation services have different lifecycle, artifact, and
resource needs.

**Consequences:** Developers opt in to stronger validation. The Makefile owns
the correct combination of Compose files and profiles.

### ADR-002: Run browser smoke against an automation UI service

**Status:** Accepted.
**Date:** 2026-07-07.
**Decision:** Add `ozone-ui-automation` for containerized Cypress instead of
driving the base `ozone-ui` service from a Cypress container.

**Reason:** The base UI's public URLs intentionally use `localhost` for a host
browser. In a Cypress container, those URLs resolve to the Cypress container and
break live XRPC calls.

**Consequences:** Browser smoke uses the same Ozone UI source but a separate
Next dev server and `.next` volume. Host-browser behavior remains covered by
the existing readiness smoke and normal manual use.

### ADR-003: Keep existing fixture-backed Cypress tests separate

**Status:** Accepted.
**Date:** 2026-07-07.
**Decision:** Add live specs under `cypress/e2e/live/` and run them with an
explicit spec glob.

**Reason:** Existing Cypress tests intentionally intercept network calls and
validate UI behavior against fixtures. Mixing live checks into those files would
make both lanes harder to diagnose.

**Consequences:** The live lane has a smaller surface but stronger integration
signal. Fixture-backed tests remain stable and fast.

### ADR-004: Use k6 for pressure and Node for protocol setup

**Status:** Accepted.
**Date:** 2026-07-07.
**Decision:** Use k6 for concurrent API pressure and Node runners for
authenticated setup, synthetic data, and firehose-specific assertions.

**Reason:** k6 gives thresholds, scenarios, and summaries. Node can reuse the
repository and atproto package ecosystem for XRPC sessions and sync/firehose
decoding.

**Consequences:** Stress tests stay small and inspectable. Protocol-specific
logic does not get forced into k6 scripts where typed clients and workspace
packages are unavailable.

### ADR-005: Reset volumes instead of deleting synthetic protocol data

**Status:** Accepted.
**Date:** 2026-07-07.
**Decision:** Make `make dev-stack-reset` the cleanup boundary for synthetic
workload data.

**Reason:** AT Protocol data is append-oriented and cross-service. Deleting
accounts, records, reports, and firehose events precisely would create a second
untested moderation system.

**Consequences:** Workload and write-enabled stress modes clearly mutate the
sandbox. Smoke modes stay non-mutating, and reset remains the reliable cleanup.

## Praemeditatio Malorum

- **Failure mode:** Automation returns green after checking only ports.
  **Why it matters:** It misses auth, proxy headers, Ozone queues, and browser
  runtime behavior.
  **Mitigation:** API smoke must log in and query Ozone; browser smoke must sign
  in through the live UI.
  **Detection:** `summary.json` must include named checks for auth,
  `queryStatuses`, `queryReports`, and UI reports rendering.

- **Failure mode:** Cypress cannot reach Ozone because public URLs contain
  `localhost`.
  **Why it matters:** This creates confusing browser-only failures in the
  container lane.
  **Mitigation:** Use `ozone-ui-automation` with Compose DNS public URLs.
  **Detection:** A Cypress preflight fetches
  `http://atproto-dev-env:2587/.well-known/ozone-metadata.json`.

- **Failure mode:** A workload runner writes build output into `../atproto`.
  **Why it matters:** It pollutes a sibling checkout and can create root-owned
  files.
  **Mitigation:** Mount `../atproto` read-only and use `atproto_workdir`.
  **Detection:** `git -C ../atproto status --short` is unchanged by automation.

- **Failure mode:** Stress tests hide root cause by running before smoke passes.
  **Why it matters:** k6 failures become noisy when the stack is unhealthy.
  **Mitigation:** `dev-stack-automation-stress` depends on live API smoke.
  **Detection:** Make target exits before k6 if smoke fails.

- **Failure mode:** Synthetic workload grows until local queries become slow for
  unrelated manual work.
  **Why it matters:** Developers lose trust in the sandbox.
  **Mitigation:** Small defaults, run-tagged data, explicit mutation warnings,
  and `make dev-stack-reset` as cleanup.
  **Detection:** `summary.json` records created account, post, and report
  counts.

- **Failure mode:** Raw k6 calls bypass the PDS/Ozone proxy behavior used by the
  UI.
  **Why it matters:** Load results do not represent real authenticated Ozone
  traffic.
  **Mitigation:** k6 logs into the PDS and sends `atproto-proxy` for Ozone
  routes.
  **Detection:** Ozone proxy response checks fail if the proxy header or DID is
  wrong.

## File Structure

Add:

- `compose.automation.yaml` - optional runner and automation UI services.
- `scripts/dev-stack/automation/artifacts.mjs` - run ID and report writer.
- `scripts/dev-stack/automation/http.mjs` - fetch wrappers, JSON assertions,
  and bounded retry helpers.
- `scripts/dev-stack/automation/ozone-live-smoke.mjs` - non-mutating live API
  smoke checks.
- `scripts/dev-stack/automation/atproto-workload.mjs` - synthetic data and
  firehose checks.
- `scripts/dev-stack/k6/api-smoke.js` - low-VU read-only pressure test.
- `scripts/dev-stack/k6/api-stress.js` - parameterized stress scenario.
- `cypress/e2e/live/auth.cy.ts` - live login smoke.
- `cypress/e2e/live/reports.cy.ts` - live reports queue smoke.

Modify:

- `Makefile` - add automation Compose variable and targets.
- `.gitignore` - ignore `.dev-stack/`.
- `docs/local-development.md` - document automation modes, artifacts, and reset
  guidance.
- `cypress.config.ts` - accept `CYPRESS_BASE_URL` or a CLI `baseUrl` without
  changing existing fixture-backed tests.

## Tasks

### Task 1: Add overlay and Make targets

**Files:** `compose.automation.yaml`, `Makefile`, `.gitignore`.

**Checklist:**
- Define `DEV_AUTOMATION_COMPOSE`.
- Add `dev-stack-automation-api-smoke`.
- Add `dev-stack-automation-browser-smoke`.
- Add `dev-stack-automation-workload`.
- Add `dev-stack-automation-stress`.
- Add `dev-stack-automation-report`.
- Add `dev-stack-automation-clean`.
- Ignore `.dev-stack/`.

**Verification command:**

```sh
docker compose -f compose.dev.yaml -f compose.automation.yaml config
make help
git diff --check -- Makefile .gitignore compose.automation.yaml
```

### Task 2: Add shared automation runtime

**Files:** `scripts/dev-stack/automation/artifacts.mjs`,
`scripts/dev-stack/automation/http.mjs`.

**Checklist:**
- Generate deterministic run IDs from UTC timestamp plus short git SHA.
- Create `.dev-stack/runs/<run-id>` with mode-specific summaries.
- Provide `fetchJson`, `postJson`, and `waitForJson` helpers.
- Redact access tokens in artifacts.
- Fail with concise messages that name the service URL and endpoint.

**Verification command:**

```sh
node --check scripts/dev-stack/automation/artifacts.mjs
node --check scripts/dev-stack/automation/http.mjs
```

### Task 3: Add live API smoke runner

**Files:** `scripts/dev-stack/automation/ozone-live-smoke.mjs`.

**Checklist:**
- Fetch `http://atproto-dev-env:2581/`.
- Read Ozone DID and service URLs.
- Create a session for `mod.test`.
- Build `atproto-proxy: <ozoneDid>#atproto_labeler`.
- Query Ozone config, statuses, reports, and queues.
- Assert seeded queues and seeded report data exist.
- Write `ozone-live-smoke.json`.

**Verification command:**

```sh
node --check scripts/dev-stack/automation/ozone-live-smoke.mjs
make dev-stack-automation-api-smoke
```

### Task 4: Add automation UI and live Cypress lane

**Files:** `compose.automation.yaml`, `cypress/e2e/live/auth.cy.ts`,
`cypress/e2e/live/reports.cy.ts`, `cypress.config.ts`.

**Checklist:**
- Add `ozone-ui-automation` with Compose-DNS `NEXT_PUBLIC_*` URLs.
- Add `cypress-live` runner targeting `http://ozone-ui-automation:3000`.
- Keep live specs free of auth intercepts.
- Verify login through Credentials tab using `mod.test` / `mod-pass`.
- Verify reports route renders live seeded moderation data.
- Save screenshots and videos under `.dev-stack/runs/<run-id>/cypress`.

**Verification command:**

```sh
make dev-stack-automation-browser-smoke
```

### Task 5: Add synthetic atproto workload and firehose checks

**Files:** `scripts/dev-stack/automation/atproto-workload.mjs`,
`compose.automation.yaml`.

**Checklist:**
- Fail if `/workspace/atproto/packages/dev-env/package.json` is missing.
- Resolve atproto workspace packages from `/workspace/atproto`.
- Create run-tagged accounts.
- Create run-tagged posts.
- Create reports against accounts and records.
- Subscribe to the local repo event stream and confirm commits for created
  DIDs.
- Verify Ozone reports or statuses include the synthetic subjects.
- Write `atproto-workload.json` with created handles, DIDs, URIs, and counts.

**Verification command:**

```sh
node --check scripts/dev-stack/automation/atproto-workload.mjs
make dev-stack-automation-workload
```

### Task 6: Add k6 smoke and stress scripts

**Files:** `scripts/dev-stack/k6/api-smoke.js`,
`scripts/dev-stack/k6/api-stress.js`, `compose.automation.yaml`.

**Checklist:**
- Fetch introspection in `setup()`.
- Create a PDS session for `mod.test`.
- Use PDS proxy headers for Ozone endpoints.
- Keep default writes disabled.
- Define request failure and latency thresholds.
- Emit JSON summaries into the active run directory.

**Verification command:**

```sh
make dev-stack-automation-stress DEV_STACK_STRESS_VUS=5 DEV_STACK_STRESS_DURATION=30s
```

### Task 7: Document and validate the full workflow

**Files:** `docs/local-development.md`.

**Checklist:**
- Explain when to use readiness, API smoke, browser smoke, workload, and stress
  modes.
- Document default knobs and safe local limits.
- Explain that workload and write-enabled stress mutate the sandbox.
- Point cleanup to `make dev-stack-reset`.
- Point artifact inspection to `make dev-stack-automation-report`.

**Verification command:**

```sh
rg -n "dev-stack-automation|workload|stress|\\.dev-stack" docs/local-development.md Makefile
git diff --check
```

## Verification Ladder

Run these checks after implementation:

```sh
docker compose -f compose.dev.yaml -f compose.automation.yaml config
bash -n scripts/dev-stack/*.sh
node --check scripts/dev-stack/automation/*.mjs
make dev-stack-reset
make dev-stack-up
make dev-stack-smoke
make dev-stack-automation-api-smoke
make dev-stack-automation-browser-smoke
make dev-stack-automation-workload
make dev-stack-automation-stress DEV_STACK_STRESS_VUS=5 DEV_STACK_STRESS_DURATION=30s
git -C ../atproto status --short
git diff --check
```

Expected results:

- Base stack smoke passes from host-visible URLs.
- API smoke passes without synthetic writes.
- Browser smoke signs in through the live UI and reaches the reports view.
- Workload smoke creates run-tagged data and confirms firehose/Ozone visibility.
- Stress run fails on threshold violations and writes `k6-summary.json`.
- `../atproto` status is unchanged by the automation.

## Rollout

Implement in one direct rollout:

1. Add overlay, targets, artifact directory, and shared runtime helpers.
2. Add non-mutating API smoke and validate against the current base stack.
3. Add automation UI and live Cypress lane.
4. Add synthetic workload and firehose checks.
5. Add k6 stress lane with conservative defaults.
6. Document all commands and cleanup behavior.
7. Commit once validation passes.

Do not publish these targets as CI requirements until the local developer flow
is stable. The first use case is repeatable local validation, not central CI
gating.

## Rollback

Runtime rollback:

```sh
docker compose -f compose.dev.yaml -f compose.automation.yaml down -v --remove-orphans
make dev-stack-reset
```

Code rollback:

```sh
git revert <automation-commit>
```

The spec itself has no runtime effect. Once implemented, the base
`compose.dev.yaml` remains the rollback boundary because the automation overlay
is opt-in.

## Engineering Ledger

**2026-07-07 planning entry**

- Assumption: local automation should privilege diagnosis over maximum load.
- Evidence: current `scripts/dev-stack/smoke.sh` is readiness-only; current
  Cypress tests are fixture-oriented; atproto dev-env already seeds accounts,
  queues, reports, and protocol services.
- Main uncertainty: exact `@atproto/sync` helper API exposed by the current
  atproto workdir at implementation time.
- Risk level: medium. The base stack remains isolated, but live browser and
  firehose automation add cross-service failure modes.
- Recommended action: implement the optional overlay with API smoke first,
  because it validates auth and proxy contracts before adding browser and load
  complexity.
- Validation plan: run the full verification ladder and confirm
  `../atproto` status is unchanged.

## RFC Sign-off

**Strategist:** Accepted for direct rollout. The optional overlay preserves the
interactive dev path while adding higher-signal local validation.

**Architect:** Accepted with one non-negotiable constraint: containerized
Cypress must use `ozone-ui-automation`, not the host-oriented base UI.

**Auditor:** Accepted with the reset contract and sibling-checkout status check
as mandatory validation steps.
