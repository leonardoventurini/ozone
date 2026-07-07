# Local development with atproto dev-env

This guide runs the Ozone web UI from this repository against the local
`@atproto/dev-env` sandbox from a sibling `atproto` checkout. The recommended
path is the coordinated Docker Compose stack, which isolates the Node versions,
Postgres, Redis, and application ports behind one command.

For production-like hosting with Docker, Postgres, Caddy, and Watchtower, use
[`HOSTING.md`](../HOSTING.md) instead.

## Repository layout

Keep `ozone` and `atproto` as siblings:

```text
bluesky/
  atproto/
  ozone/
```

If `atproto` is not present yet:

```sh
cd ..
git clone https://github.com/bluesky-social/atproto.git
cd ozone
```

## Prerequisites

For the Docker Compose workflow:

- Docker with the Compose plugin, or the standalone `docker-compose` command.
- A sibling `atproto` checkout.

For the manual host workflow:

Use separate shells for the two repositories. They intentionally use different
Node versions:

- `ozone` requires Node 20.x and Yarn 4.8.1.
- `atproto` requires Node 22 or later and pnpm 11.5.2.

The atproto dev environment also needs Docker and `jq` for the default local
Postgres and Redis setup.

If `corepack` is not available after installing Node, install it once:

```sh
npm install --global corepack
```

## Coordinated Docker Compose stack

From this repository:

```sh
make dev-stack-up
```

This starts:

- Ozone UI: <http://localhost:3000>
- atproto introspection: <http://localhost:2581>
- dev-env PLC: <http://localhost:2582>
- dev-env PDS: <http://localhost:2583>
- dev-env AppView: <http://localhost:2584>
- dev-env Ozone backend: <http://localhost:2587>

In a second shell, verify readiness:

```sh
make dev-stack-smoke
```

The UI is configured with
`NEXT_PUBLIC_OZONE_PUBLIC_URL=http://localhost:2587`, so it discovers the
current Ozone service DID from the dev-env backend automatically. You do not
need to copy `NEXT_PUBLIC_OZONE_SERVICE_DID` into `.env.local` for the Compose
workflow.

The sibling `atproto` checkout is mounted read-only. The Compose stack syncs
tracked, modified, and non-ignored source files into a Docker workdir volume
before installing dependencies and building, so generated atproto output stays
inside Docker volumes instead of the sibling checkout.

Stop the stack without deleting dependency or database volumes:

```sh
make dev-stack-down
```

Reset the stack completely, including Postgres, Redis, atproto workdir,
dependency caches, and Next build output volumes:

```sh
make dev-stack-reset
```

Follow logs from another shell:

```sh
make dev-stack-logs
```

## Sign in

Use the Credentials tab with the local PDS:

```text
Service URL: http://localhost:2583
Account handle: mod.test
Password: mod-pass
```

Other seeded accounts:

- `triage.test` / `triage-pass`
- `admin-mod.test` / `admin-mod-pass`

## Manual host workflow

Use this if you need to run either repository directly on the host.

### Prepare atproto

In the sibling `atproto` checkout:

```sh
cd ../atproto
corepack enable
corepack prepare pnpm@11.5.2 --activate
make deps
make build
```

Start the sandbox and leave it running:

```sh
make run-dev-env
```

The startup output should include the local service URLs and the Ozone service
DID:

```text
👤 DID Placeholder server http://localhost:2582
🌞 Main PDS http://localhost:2583
🗼 Ozone server http://localhost:2587
🗼 Ozone service DID did:plc:xxxxx
🌅 Bsky Appview http://localhost:2584
```

Copy the `did:plc:xxxxx` value. The DID changes when the dev environment is
recreated.

### Prepare Ozone

In this repository:

```sh
cd ../ozone
corepack enable
corepack prepare yarn@4.8.1 --activate
yarn install --immutable
```

Create `.env.local` with the Ozone service DID printed by `make run-dev-env`:

```sh
NEXT_PUBLIC_OZONE_SERVICE_DID=did:plc:xxxxx
```

Start the Ozone UI and leave it running:

```sh
yarn dev
```

Open <http://localhost:3000>.

## What is running

For both local workflows:

- The `atproto` dev environment provides the local PLC server, PDS, AppView,
  Ozone service backend, and Ozone daemon.
- This repository provides the Next.js Ozone web UI on port 3000.
- You do not need the production hosting Docker compose setup, Caddy,
  Watchtower, or a separately managed Ozone Postgres database.

## Troubleshooting

If the Compose UI stays on the loading spinner, run `make dev-stack-smoke` and
check that `http://localhost:2587/.well-known/ozone-metadata.json` is reachable.

If the manual UI stays on the loading spinner, check that `.env.local` contains
`NEXT_PUBLIC_OZONE_SERVICE_DID`, that the DID matches the current
`make run-dev-env` output, and that you restarted `yarn dev` after changing the
file.

If the dev environment fails with a missing `dist/bin.js` or stale package
output in the manual workflow, run `make build` again in `../atproto`.

If Docker is unavailable, the atproto helper falls back to host Postgres and
Redis environment variables in the manual workflow. The recommended setup is to
keep Docker running and use `make dev-stack-up`.

If the Compose workflow fails during `pnpm install` with a registry timeout or
`ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`, rerun `make dev-stack-up`. The stack
keeps the pnpm store in a Docker volume, so a retry can reuse partial download
state. On slow networks, increase the pnpm request settings without disabling
atproto's supply-chain policy:

```sh
PNPM_FETCH_RETRIES=8 PNPM_FETCH_TIMEOUT_MS=600000 make dev-stack-up
```

If port 3000 is already in use, run the Ozone UI on another port:

```sh
yarn dev -p 3001
```

For the Compose workflow, stop the process using port 3000 or edit
`compose.dev.yaml` locally to publish a different host port.
