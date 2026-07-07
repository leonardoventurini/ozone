#!/usr/bin/env bash
set -euo pipefail

if [[ "$(id -u)" == "0" && "${DEV_STACK_DROPPED_PRIVILEGES:-0}" != "1" ]]; then
  mkdir -p /workspace/ozone/node_modules /workspace/ozone/.next
  chown -R node:node /workspace/ozone/node_modules /workspace/ozone/.next /home/node
  export DEV_STACK_DROPPED_PRIVILEGES=1
  exec gosu node bash "$0"
fi

cd /workspace/ozone

if [[ ! -f package.json ]]; then
  echo "Missing /workspace/ozone/package.json. Is the Ozone repo mounted?" >&2
  exit 1
fi

echo "[ozone-ui] installing dependencies with yarn"
yarn install --immutable

metadata_url="${ATPROTO_OZONE_INTERNAL_URL:-http://atproto-dev-env:2587}/.well-known/ozone-metadata.json"
timeout_seconds="${OZONE_UI_WAIT_TIMEOUT_SECONDS:-180}"

echo "[ozone-ui] waiting for ${metadata_url}"
node - "${metadata_url}" "${timeout_seconds}" <<'NODE'
const [url, timeoutSecondsRaw] = process.argv.slice(2)
const timeoutMs = Number(timeoutSecondsRaw) * 1000
const startedAt = Date.now()

async function waitForMetadata() {
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        if (typeof data.did === 'string') {
          process.exit(0)
        }
      }
    } catch {
      // Keep polling until the timeout; the dependency may still be booting.
    }

    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  console.error(`Timed out waiting for Ozone metadata at ${url}`)
  process.exit(1)
}

waitForMetadata()
NODE

echo "[ozone-ui] starting Next.js dev server"
exec yarn dev -H 0.0.0.0
