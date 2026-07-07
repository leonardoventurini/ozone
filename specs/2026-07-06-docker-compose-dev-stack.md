# Docker Compose Dev Stack - Campaign Plan

> For agentic workers: execute task-by-task in the current session by default
> only after this spec is accepted or the user asks to implement it.

**Goal:** Provide a single Docker Compose workflow that runs the Ozone UI and
the sibling atproto dev-env stack in an isolated, coordinated local sandbox.
**Cynefin classification:** Complicated.
**Intensity tier:** Raid - cross-repository dev workflow with Docker,
networking, dependency caching, and browser-visible identity URLs.
**RFC mode:** internal. Subagent tooling is not exposed in this session.
**Delegation profile:** local only.
**Model/cost profile:** inherit by default; no subagent lanes.
**Cortex context:** unavailable in this session; local file reads used instead.
**Architecture:** One Compose project owns Postgres, Redis, an atproto dev-env
runner, and an Ozone UI runner. The atproto dev-env process still owns PLC, PDS,
AppView, Ozone service backend, and the Ozone daemon. The browser-facing URLs
remain `http://localhost:*` because DID docs and Next public env are consumed by
the host browser.
**Tech stack:** Docker Compose, Node 24 for atproto, pnpm 11.5.2, Node 20 for
Ozone UI, Yarn 4.8.1, Postgres 14, Redis 7.
**Parallelism profile:** single-lane - implementation files share one runtime
contract.
**Design context source:** n/a.
**Repository context:** text-search sufficient; syntax-aware matching is not
load-bearing.

**Shadow Team Assignments:**
- Bellion [Strategist]: plan integrity and acceptance.
- Beru [Auditor->Executor]: local repository reconnaissance.
- Kamish [Architect]: service topology and contracts.
- Greed [Executor]: Docker Compose and developer workflow.
- Fangs [Auditor]: verification ladder and smoke checks.
- Tank [Auditor]: isolation, rollback, and secret-safety risks.
- Igris [Executor]: documentation quality and implementation task shape.
- Munger [Strategist]: inversion pass for dev-workflow failure modes.

## Answer

Yes. The stack is feasible without splitting the atproto dev-env into separate
service containers. The recommended implementation is a repository-local
`compose.dev.yaml` that runs:

- `postgres`: isolated test database for atproto dev-env.
- `redis`: isolated cache for atproto dev-env.
- `atproto-dev-env`: Node 24 container bound to `../atproto`, using pnpm and
  host-facing ports `2581`, `2582`, `2583`, `2584`, and `2587`.
- `ozone-ui`: Node 20 container bound to this repository, using Yarn and
  host-facing port `3000`.

The Ozone UI should not parse the random Ozone DID from logs. It should use
`NEXT_PUBLIC_OZONE_PUBLIC_URL=http://localhost:2587`; the existing UI config can
fetch `/.well-known/ozone-metadata.json` from the dev-env Ozone backend and then
resolve the DID through the dev-env PLC endpoint.

## Evidence

- Ozone declares Node 20.x and Yarn 4.8.1 in `package.json`.
- atproto declares Node >=22, `.nvmrc` contains `24`, and `package.json`
  requires pnpm 11.5.2.
- atproto `packages/dev-env/src/bin.ts` starts:
  - PLC on `http://localhost:2582`
  - PDS on `http://localhost:2583`
  - AppView on `http://localhost:2584`
  - Ozone backend on `http://localhost:2587`
  - introspection on `http://localhost:2581`
- atproto `packages/dev-env/src/network.ts` creates the Ozone service profile,
  runs the Ozone service backend and daemon, migrates it onto the PDS, and seeds
  policies.
- atproto `packages/dev-env/src/ozone.ts` runs Ozone migrations and starts the
  Ozone daemon in the same dev-env process.
- atproto `packages/dev-infra/_common.sh` falls back to host-provided
  `DB_TEST_POSTGRES_URL` and `REDIS_TEST_HOST` when Docker is unavailable inside
  the Node runner. The Compose implementation can intentionally provide those
  internal container URLs and avoid Docker-in-Docker.
- Ozone `lib/client-config.ts` supports discovery from
  `NEXT_PUBLIC_OZONE_PUBLIC_URL` when `NEXT_PUBLIC_OZONE_SERVICE_DID` is not
  provided.
- atproto `packages/ozone/src/api/well-known.ts` exposes
  `/.well-known/ozone-metadata.json`.

## Munger Memo

**Inversion:** This fails if we confuse container-internal URLs with
browser-visible URLs and ship a stack that starts but cannot log in.
**Incentive map:** Developers want one command; Compose rewards hiding setup;
the hidden cost is slow first boot and opaque failures if readiness is weak.
**Standard Stupidities in play:** overconfidence in localhost semantics,
complexity worship, and authority deference to the existing hosting compose.
**Circle of competence:** In - the relevant source files and config paths were
verified locally.
**Verdict:** Green with one caveat: implementation must smoke-test from the
host browser perspective, not only from inside containers.

## Clarity Pass

The stack should work like this: Docker starts Postgres and Redis first. A Node
24 atproto container then installs/builds the sibling atproto checkout and runs
`packages/dev-env`, using the Compose Postgres and Redis instead of trying to
start its own dependency containers. A separate Node 20 Ozone container installs
this repository and runs `next dev`. The browser still talks to `localhost:3000`
for the UI and `localhost:2582/2583/2584/2587` for the dev-env services.

Concrete example:

1. Developer runs `make dev-stack-up`.
2. Compose starts `postgres` and `redis` on an internal network.
3. `atproto-dev-env` starts and prints the local service map.
4. `ozone-ui` starts with `NEXT_PUBLIC_OZONE_PUBLIC_URL=http://localhost:2587`.
5. Browser opens `http://localhost:3000`.
6. UI fetches `http://localhost:2587/.well-known/ozone-metadata.json`, resolves
   the DID via `http://localhost:2582`, and shows the login form.
7. Developer signs in with PDS URL `http://localhost:2583`, handle `mod.test`,
   and password `mod-pass`.

## ADRs

### ADR-001: Keep atproto dev-env as one process

**Status:** Accepted.
**Date:** 2026-07-06.
**Deciders:** Kamish, Greed, Bellion.

**Context:** atproto dev-env already composes PLC, PDS, AppView, Bsync, Ozone
backend, Ozone daemon, seeded accounts, service profiles, and test policies.

**Decision:** Run `packages/dev-env` inside one `atproto-dev-env` container
instead of decomposing each atproto service into separate Compose services.

**Alternatives considered:** Split PLC/PDS/AppView/Ozone/Bsync into separate
containers; rejected because it duplicates `TestNetwork.create()` wiring,
requires additional atproto changes, and is more likely to drift from upstream
test behavior. Run the current host workflow inside Compose with Docker socket
mounts; rejected because Docker-in-Docker or host Docker socket access reduces
isolation.

**Consequences:** The main developer services have stable ports, while some
internal support services remain process-local or dynamically assigned. The
stack is simpler and tracks upstream dev-env behavior.

### ADR-002: Discover Ozone by public URL, not log parsing

**Status:** Accepted.
**Date:** 2026-07-06.
**Deciders:** Kamish, Igris, Bellion.

**Context:** The Ozone service DID is generated when dev-env starts and changes
when the sandbox is recreated. The existing manual setup asks developers to copy
that DID into `.env.local`.

**Decision:** Set `NEXT_PUBLIC_OZONE_PUBLIC_URL=http://localhost:2587` in the
Ozone UI container and omit `NEXT_PUBLIC_OZONE_SERVICE_DID`.

**Alternatives considered:** Parse `atproto-dev-env` logs into a shared env
file; rejected as fragile. Add a custom atproto wrapper that writes the DID to a
shared volume; rejected until a real need appears. Continue requiring manual
DID copy; rejected because it breaks the one-command Compose goal.

**Consequences:** Compose startup is deterministic and does not depend on log
format. Browser-visible port `2587` becomes part of the local dev contract.

### ADR-003: Use dev images plus bind-mounted source and dependency volumes

**Status:** Accepted.
**Date:** 2026-07-06.
**Deciders:** Greed, Tank, Bellion.

**Context:** Developers need live source edits, but host Node versions differ:
Ozone wants Node 20 and atproto wants Node 24.

**Decision:** Build small dev base images under `docker/dev/`, bind mount source
repositories, and keep `node_modules`, `.next`, and pnpm store data in named
Docker volumes.

**Alternatives considered:** Bake both repositories into images; rejected
because live editing becomes awkward. Use host package managers and only
containerize Postgres/Redis; rejected because it does not solve coordinated
Node-version isolation. Mount host `node_modules`; rejected because host and
container dependency trees will conflict.

**Consequences:** First boot is slower, later boots reuse dependency volumes,
and host dependency directories remain untouched.

### ADR-004: Use Compose-owned Postgres and Redis instead of Docker-in-Docker

**Status:** Accepted.
**Date:** 2026-07-06.
**Deciders:** Greed, Tank, Fangs.

**Context:** atproto's `with-test-redis-and-db.sh` can start dependency
containers when Docker is available. Inside the dev runner container, providing
Docker access would require mounting the host socket.

**Decision:** Do not mount the host Docker socket. Provide
`DB_TEST_POSTGRES_URL` and `REDIS_TEST_HOST` so the helper uses native mode
against Compose services.

**Alternatives considered:** Mount `/var/run/docker.sock`; rejected for safety
and isolation. Reuse atproto's internal `packages/dev-infra/docker-compose.yaml`
directly; rejected because it starts a separate Compose project and does not
coordinate Ozone UI.

**Consequences:** Compose owns dependency lifecycle and `docker compose down -v`
fully resets the sandbox.

## Praemeditatio Malorum

- **Failure mode:** UI container receives container-internal URLs such as
  `http://atproto-dev-env:2587`.
  **Why it matters:** The browser cannot resolve Compose service names, so login
  and config discovery fail.
  **Mitigation:** Use `localhost` for every `NEXT_PUBLIC_*` URL and published
  ports for browser-facing services.
  **Detection:** Open `http://localhost:3000` and verify browser network calls
  to `localhost:2587`, `localhost:2582`, and `localhost:2583` succeed.
  **Recovery:** Revert the Compose env block or set the correct
  `NEXT_PUBLIC_*` values.

- **Failure mode:** atproto dev-env tries to start its own Docker dependencies
  from inside the container.
  **Why it matters:** It either fails because Docker is unavailable or pierces
  isolation by requiring the host Docker socket.
  **Mitigation:** Do not install Docker in the runner image; set
  `DB_TEST_POSTGRES_URL` and `REDIS_TEST_HOST`.
  **Detection:** `docker compose logs atproto-dev-env` must include native DB
  and Redis env usage, and must not call host Docker successfully.
  **Recovery:** Fix the atproto entrypoint env and rerun
  `docker compose -f compose.dev.yaml down -v && docker compose -f compose.dev.yaml up`.

- **Failure mode:** First boot appears hung while atproto dependencies install
  and build.
  **Why it matters:** Developers may kill the stack before it is actually ready.
  **Mitigation:** Entry scripts print step labels before install, build, and
  run phases.
  **Detection:** Logs show the current step and final dev-env service map.
  **Recovery:** Re-run with `docker compose logs -f atproto-dev-env`.

- **Failure mode:** Host-owned files are created by root inside bind mounts.
  **Why it matters:** Follow-up local edits and cleanup become painful.
  **Mitigation:** Dev images run as the container `node` user where possible and
  write dependency artifacts to named volumes.
  **Detection:** `find . ../atproto -user root -maxdepth 3` after a smoke run
  reports no task-owned source files.
  **Recovery:** Adjust Dockerfile user/workdir ownership and remove root-owned
  artifacts with explicit user approval.

- **Failure mode:** Ozone UI starts before dev-env Ozone is ready.
  **Why it matters:** The UI initially shows an error or loading state that
  looks like broken setup.
  **Mitigation:** `ozone-ui` entrypoint waits for
  `http://host.docker.internal:2587/.well-known/ozone-metadata.json` or
  `http://atproto-dev-env:2587/.well-known/ozone-metadata.json` if container
  networking proves reachable; the browser-facing public URL remains localhost.
  **Detection:** `docker compose ps` reports both app services healthy before
  docs claim the stack is ready.
  **Recovery:** Strengthen healthchecks and wait loops.

## Proposed File Structure

- `compose.dev.yaml` - root Compose file for coordinated local sandbox.
- `docker/dev/atproto.Dockerfile` - Node 24 pnpm dev runner base image.
- `docker/dev/ozone-ui.Dockerfile` - Node 20 Yarn dev runner base image.
- `scripts/dev-stack/check-sibling-atproto.sh` - preflight that fails clearly
  when `../atproto` is missing.
- `scripts/dev-stack/atproto-entrypoint.sh` - install/build/run atproto
  dev-env against Compose Postgres and Redis.
- `scripts/dev-stack/ozone-ui-entrypoint.sh` - install/run Next dev server with
  stable browser-facing env.
- `scripts/dev-stack/smoke.sh` - host-side readiness smoke check.
- `Makefile` - add `dev-stack-up`, `dev-stack-down`, `dev-stack-logs`,
  `dev-stack-smoke`, and `dev-stack-reset` targets.
- `docs/local-development.md` - document Compose as the coordinated path and
  keep the host-runner path as the fallback/manual path.
- `AGENTS.md` - point future agents at the Compose dev stack once implemented.

## Service Contract

### `postgres`

- Image: `postgres:14-alpine`.
- Internal port: `5432`.
- Environment: `POSTGRES_USER=pg`, `POSTGRES_PASSWORD=password`,
  `POSTGRES_DB=postgres`.
- Healthcheck: `pg_isready -U pg`.
- Volume: `ozone_dev_postgres:/var/lib/postgresql/data`.
- Host port: not published by default.

### `redis`

- Image: `redis:7-alpine`.
- Internal port: `6379`.
- Healthcheck: `redis-cli ping`.
- Volume: `ozone_dev_redis:/data`.
- Host port: not published by default.

### `atproto-dev-env`

- Build: `docker/dev/atproto.Dockerfile`.
- Workdir: `/workspace/atproto`.
- Source mount: `../atproto:/workspace/atproto`.
- Dependency volumes:
  - `atproto_node_modules:/workspace/atproto/node_modules`
  - `atproto_pnpm_store:/home/node/.local/share/pnpm/store`
- Environment:
  - `NODE_ENV=development`
  - `DB_TEST_POSTGRES_URL=postgresql://pg:password@postgres:5432/postgres`
  - `REDIS_TEST_HOST=redis:6379`
  - `DB_POSTGRES_SCHEMA=dev`
- Command: `scripts/dev-stack/atproto-entrypoint.sh`.
- Published ports:
  - `2581:2581` for introspection
  - `2582:2582` for PLC
  - `2583:2583` for PDS
  - `2584:2584` for AppView
  - `2587:2587` for Ozone backend
- Healthcheck: Node `fetch('http://localhost:2587/xrpc/_health')`.

### `ozone-ui`

- Build: `docker/dev/ozone-ui.Dockerfile`.
- Workdir: `/workspace/ozone`.
- Source mount: `.:/workspace/ozone`.
- Dependency volumes:
  - `ozone_node_modules:/workspace/ozone/node_modules`
  - `ozone_next:/workspace/ozone/.next`
- Environment:
  - `NODE_ENV=development`
  - `NEXT_PUBLIC_OZONE_PUBLIC_URL=http://localhost:2587`
  - `NEXT_PUBLIC_PLC_DIRECTORY_URL=http://localhost:2582`
  - `NEXT_PUBLIC_SOCIAL_APP_URL=http://localhost:2584`
  - `NEXT_PUBLIC_HANDLE_RESOLVER_URL=http://localhost:2584`
- Command: `scripts/dev-stack/ozone-ui-entrypoint.sh`.
- Published ports:
  - `3000:3000`
- Healthcheck: Node `fetch('http://localhost:3000')`.

## Proposed Compose Skeleton

```yaml
services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_USER: pg
      POSTGRES_PASSWORD: password
      POSTGRES_DB: postgres
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U pg"]
      interval: 1s
      timeout: 5s
      retries: 30
    volumes:
      - ozone_dev_postgres:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    command: redis-server --save 60 1 --loglevel warning
    healthcheck:
      test: ["CMD-SHELL", "[ \"$$(redis-cli ping)\" = \"PONG\" ]"]
      interval: 1s
      timeout: 5s
      retries: 30
    volumes:
      - ozone_dev_redis:/data

  atproto-dev-env:
    build:
      context: .
      dockerfile: docker/dev/atproto.Dockerfile
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    working_dir: /workspace/atproto
    environment:
      NODE_ENV: development
      DB_TEST_POSTGRES_URL: postgresql://pg:password@postgres:5432/postgres
      REDIS_TEST_HOST: redis:6379
      DB_POSTGRES_SCHEMA: dev
    volumes:
      - .:/workspace/ozone:ro
      - ../atproto:/workspace/atproto
      - atproto_node_modules:/workspace/atproto/node_modules
      - atproto_pnpm_store:/home/node/.local/share/pnpm/store
    ports:
      - "2581:2581"
      - "2582:2582"
      - "2583:2583"
      - "2584:2584"
      - "2587:2587"
    command: ["/workspace/ozone/scripts/dev-stack/atproto-entrypoint.sh"]
    healthcheck:
      test:
        [
          "CMD-SHELL",
          "node -e \"fetch('http://localhost:2587/xrpc/_health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))\"",
        ]
      interval: 5s
      timeout: 5s
      retries: 60

  ozone-ui:
    build:
      context: .
      dockerfile: docker/dev/ozone-ui.Dockerfile
    depends_on:
      atproto-dev-env:
        condition: service_healthy
    working_dir: /workspace/ozone
    environment:
      NODE_ENV: development
      ATPROTO_OZONE_INTERNAL_URL: http://atproto-dev-env:2587
      NEXT_PUBLIC_OZONE_PUBLIC_URL: http://localhost:2587
      NEXT_PUBLIC_PLC_DIRECTORY_URL: http://localhost:2582
      NEXT_PUBLIC_SOCIAL_APP_URL: http://localhost:2584
      NEXT_PUBLIC_HANDLE_RESOLVER_URL: http://localhost:2584
    volumes:
      - .:/workspace/ozone
      - ozone_node_modules:/workspace/ozone/node_modules
      - ozone_next:/workspace/ozone/.next
    ports:
      - "3000:3000"
    command: ["/workspace/ozone/scripts/dev-stack/ozone-ui-entrypoint.sh"]
    healthcheck:
      test:
        [
          "CMD-SHELL",
          "node -e \"fetch('http://localhost:3000').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))\"",
        ]
      interval: 5s
      timeout: 5s
      retries: 60

volumes:
  ozone_dev_postgres:
  ozone_dev_redis:
  atproto_node_modules:
  atproto_pnpm_store:
  ozone_node_modules:
  ozone_next:
```

The `atproto-dev-env` service mounts this repository read-only at
`/workspace/ozone` so it can execute the shared entrypoint script without
writing into the Ozone checkout.

## Slices

1. **Container contracts** - Tasks: 1, 2 - checkpoint:
   `docker compose -f compose.dev.yaml config`.
2. **Coordinated runtime** - Tasks: 3, 4 - checkpoint:
   `make dev-stack-smoke`.
3. **Documentation and defaults** - Tasks: 5, 6 - checkpoint:
   docs checks plus full stack smoke run.

## Tasks

### Task 1: Add dev runner images

**Files:** Create `docker/dev/atproto.Dockerfile`;
`docker/dev/ozone-ui.Dockerfile`.
**Owner:** Greed.
**Auditor:** Tank.
**Risk:** medium.
**Risk basis:** images affect local filesystem ownership and dependency cache
behavior; no production path touched.
**Verification rung:** integration.
**Verification command:** `docker build -f docker/dev/atproto.Dockerfile . &&
docker build -f docker/dev/ozone-ui.Dockerfile .`.
**Rollback command:** `git rm -r docker/dev`.
**Definition of Done:** Images build, install the exact package managers, run as
non-root where source ownership permits, and include only dev tooling required
for this stack.

Implementation contract:

- `atproto.Dockerfile` uses `node:24-bookworm`, installs `corepack`, `jq`, and
  `ca-certificates`, activates `pnpm@11.5.2`, and uses the `node` user.
- `ozone-ui.Dockerfile` uses `node:20.11-bookworm`, installs `corepack` and
  `ca-certificates`, activates `yarn@4.8.1`, and uses the `node` user.

### Task 2: Add entrypoint scripts

**Files:** Create `scripts/dev-stack/check-sibling-atproto.sh`;
`scripts/dev-stack/atproto-entrypoint.sh`;
`scripts/dev-stack/ozone-ui-entrypoint.sh`.
**Owner:** Greed.
**Auditor:** Fangs.
**Risk:** medium.
**Risk basis:** startup scripts define the developer experience and failure
messages.
**Verification rung:** integration.
**Verification command:** `zsh -n scripts/dev-stack/*.sh`.
**Rollback command:** `git rm -r scripts/dev-stack`.
**Definition of Done:** Scripts fail fast for missing sibling repo, print
phase labels, install dependencies into container volumes, and start long-lived
dev servers.

Implementation contract:

- `check-sibling-atproto.sh` exits non-zero if `../atproto/package.json` is
  absent.
- `atproto-entrypoint.sh` runs `pnpm install --frozen-lockfile`, `pnpm build`,
  then `pnpm --dir packages/dev-env run start`.
- `ozone-ui-entrypoint.sh` runs `yarn install --immutable`, waits for Ozone
  metadata at `$ATPROTO_OZONE_INTERNAL_URL/.well-known/ozone-metadata.json`,
  then runs `yarn dev -H 0.0.0.0`.

### Task 3: Add Compose orchestration

**Files:** Create `compose.dev.yaml`.
**Owner:** Greed.
**Auditor:** Tank.
**Risk:** medium.
**Risk basis:** Compose networking and port publication are easy to get subtly
wrong.
**Verification rung:** contract.
**Verification command:** `docker compose -f compose.dev.yaml config`.
**Rollback command:** `git rm compose.dev.yaml`.
**Definition of Done:** Compose validates, uses one project network, owns
Postgres and Redis, publishes expected ports, and does not mount the host Docker
socket.

### Task 4: Add smoke checks and Makefile targets

**Files:** Create `scripts/dev-stack/smoke.sh`; modify `Makefile`.
**Owner:** Fangs.
**Auditor:** Igris.
**Risk:** low.
**Risk basis:** local developer commands only.
**Verification rung:** integration.
**Verification command:** `make help && zsh -n scripts/dev-stack/smoke.sh`.
**Rollback command:** `git checkout -- Makefile && git rm scripts/dev-stack/smoke.sh`.
**Definition of Done:** The workflow exposes exact commands:

- `make dev-stack-up`
- `make dev-stack-down`
- `make dev-stack-logs`
- `make dev-stack-smoke`
- `make dev-stack-reset`

Smoke checks:

- `curl --fail http://localhost:2581/`
- `OZONE_DID="$(curl --fail --silent http://localhost:2581/ | jq --raw-output .ozone.did)" && curl --fail "http://localhost:2582/${OZONE_DID}/data"`
- `curl --fail http://localhost:2583/xrpc/_health`
- `curl --fail http://localhost:2584/xrpc/_health`
- `curl --fail http://localhost:2587/xrpc/_health`
- `curl --fail http://localhost:2587/.well-known/ozone-metadata.json`
- `curl --fail http://localhost:3000`

### Task 5: Update documentation

**Files:** Modify `docs/local-development.md`; optionally modify `README.md` if
the Compose path becomes the recommended entrypoint.
**Owner:** Igris.
**Auditor:** Bellion.
**Risk:** low.
**Risk basis:** documentation only.
**Verification rung:** citation-audit against local files.
**Verification command:** `rg -n "compose.dev|dev-stack|NEXT_PUBLIC_OZONE_PUBLIC_URL|NEXT_PUBLIC_OZONE_SERVICE_DID" docs/local-development.md README.md`.
**Rollback command:** `git checkout -- docs/local-development.md README.md`.
**Definition of Done:** Docs explain when to use Compose, how to reset volumes,
what ports are exposed, and how Compose differs from the manual host workflow.

### Task 6: Run full local validation

**Files:** No new files; verifies all previous tasks.
**Owner:** Fangs.
**Auditor:** Bellion.
**Risk:** medium.
**Risk basis:** this is the only proof that Compose, atproto dev-env, browser
URLs, and Ozone UI discovery all agree.
**Verification rung:** integration.
**Verification command:** `make dev-stack-reset && make dev-stack-up` in one
terminal, then `make dev-stack-smoke` in another terminal after healthchecks are
green.
**Rollback command:** `docker compose -f compose.dev.yaml down -v`.
**Definition of Done:** Ozone UI is reachable at `http://localhost:3000`; Ozone
metadata is reachable at port `2587`; the login form accepts the local PDS URL
`http://localhost:2583` with `mod.test` / `mod-pass`.

## Verification

Minimum checks before merging implementation:

```sh
docker compose -f compose.dev.yaml config
zsh -n scripts/dev-stack/*.sh
make dev-stack-reset
make dev-stack-up
make dev-stack-smoke
```

Manual browser check:

1. Open `http://localhost:3000`.
2. Use the Credentials tab.
3. Enter service URL `http://localhost:2583`.
4. Sign in as `mod.test` with password `mod-pass`.
5. Confirm the app reaches a moderator-capable page instead of the setup modal.

## Rollout

- Feature flag: n/a.
- Progressive stages: add files behind explicit `make dev-stack-*` targets,
  then document as recommended after smoke validation passes.
- Telemetry gates: n/a for local dev; healthchecks and smoke script are the
  readiness gates.
- Abort conditions: Compose validates but browser login fails; container startup
  creates root-owned source files; first boot cannot complete without manual DID
  copying.

## Rollback

- Trigger conditions: smoke script fails after implementation, Docker setup
  damages source ownership, or the stack requires mounting the host Docker
  socket.
- Command: `docker compose -f compose.dev.yaml down -v` followed by reverting
  the implementation commit.
- Data repair: remove named Compose volumes through the rollback command.
- Verification: manual local setup in `docs/local-development.md` still works.
- Dry-run evidence: Task 6 must run the rollback command and record the output
  before the implementation commit.

## Open Questions

- Whether to publish Postgres `5433` and Redis `6380` for debugging should be
  decided during implementation. Default should keep them private for isolation.
- Whether to expose atproto's dynamic Bsync port is not required for Ozone UI
  development. If future debugging needs it, add a separate atproto wrapper
  after confirming upstream supports a stable Bsync port without patching
  atproto.
- Whether `next dev -H 0.0.0.0` is sufficient for all local hosts should be
  confirmed in Task 6.

## Engineering Ledger

### 2026-07-06 - Planning evidence

**Mode:** Planning.
**Context:** Inspected Ozone UI config, atproto dev-env startup, atproto
dependency helper, and Ozone well-known metadata endpoint.
**Evidence:** Ozone supports `NEXT_PUBLIC_OZONE_PUBLIC_URL`; atproto dev-env
starts PLC/PDS/AppView/Ozone on stable ports; atproto helper can use provided
Postgres and Redis env in native mode.
**Decision / next step:** Save this spec; implement only after user acceptance
or explicit execution request.
**ADR impact:** ADR-001 through ADR-004 accepted in this spec.
