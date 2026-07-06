# Local development with atproto dev-env

This guide runs the Ozone web UI from this repository against the local
`@atproto/dev-env` sandbox from a sibling `atproto` checkout. It is the minimal
setup for UI and moderation workflow development without self-hosting Ozone.

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

## Prepare atproto

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

## Prepare Ozone

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

## What is running

For this local workflow:

- The `atproto` dev environment provides the local PLC server, PDS, AppView,
  Ozone service backend, and Ozone daemon.
- This repository provides only the Next.js Ozone web UI on port 3000.
- You do not need this repository's Docker compose setup, Caddy, Watchtower, or
  a separately managed Ozone Postgres database.

## Troubleshooting

If the UI stays on the loading spinner, check that `.env.local` contains
`NEXT_PUBLIC_OZONE_SERVICE_DID`, that the DID matches the current
`make run-dev-env` output, and that you restarted `yarn dev` after changing the
file.

If the dev environment fails with a missing `dist/bin.js` or stale package
output, run `make build` again in `../atproto`.

If Docker is unavailable, the atproto helper falls back to host Postgres and
Redis environment variables. The minimal recommended setup is to keep Docker
running before `make run-dev-env`.

If port 3000 is already in use, run the Ozone UI on another port:

```sh
yarn dev -p 3001
```
