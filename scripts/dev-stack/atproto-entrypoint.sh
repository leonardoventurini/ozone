#!/usr/bin/env bash
set -euo pipefail

if [[ "$(id -u)" == "0" && "${DEV_STACK_DROPPED_PRIVILEGES:-0}" != "1" ]]; then
  mkdir -p /workspace/atproto/node_modules /home/node/.local/share/pnpm/store
  chown -R node:node /workspace/atproto /home/node/.local
  export DEV_STACK_DROPPED_PRIVILEGES=1
  exec gosu node bash "$0"
fi

ATPROTO_SOURCE_DIR="${ATPROTO_SOURCE_DIR:-/workspace/atproto-source}"
ATPROTO_WORK_DIR="/workspace/atproto"

if [[ ! -f "${ATPROTO_SOURCE_DIR}/package.json" ]]; then
  echo "Missing ${ATPROTO_SOURCE_DIR}/package.json. Is ../atproto mounted?" >&2
  exit 1
fi

echo "[atproto-dev-env] syncing atproto source into isolated Docker volume"
source_manifest="$(mktemp)"
trap 'rm -f "${source_manifest}"' EXIT
git -C "${ATPROTO_SOURCE_DIR}" \
  -c safe.directory="${ATPROTO_SOURCE_DIR}" \
  ls-files -z --cached --modified --others --exclude-standard > "${source_manifest}"
find "${ATPROTO_WORK_DIR}" -mindepth 1 -maxdepth 1 ! -name node_modules -exec rm -rf {} +
rsync -a --from0 --files-from="${source_manifest}" "${ATPROTO_SOURCE_DIR}/" "${ATPROTO_WORK_DIR}/"
rm -f "${source_manifest}"
trap - EXIT

cd /workspace/atproto
export PNPM_STORE_DIR="${PNPM_STORE_DIR:-/home/node/.local/share/pnpm/store}"
export PNPM_FETCH_RETRIES="${PNPM_FETCH_RETRIES:-5}"
export PNPM_FETCH_RETRY_MAX_TIMEOUT_MS="${PNPM_FETCH_RETRY_MAX_TIMEOUT_MS:-120000}"
export PNPM_FETCH_TIMEOUT_MS="${PNPM_FETCH_TIMEOUT_MS:-300000}"

if [[ ! -f package.json ]]; then
  echo "Missing /workspace/atproto/package.json after source sync." >&2
  exit 1
fi

if [[ -z "${DB_TEST_POSTGRES_URL:-}" ]]; then
  echo "DB_TEST_POSTGRES_URL is required." >&2
  exit 1
fi

if [[ -z "${REDIS_TEST_HOST:-}" ]]; then
  echo "REDIS_TEST_HOST is required." >&2
  exit 1
fi

echo "[atproto-dev-env] installing dependencies with pnpm"
pnpm install \
  --frozen-lockfile \
  --store-dir "${PNPM_STORE_DIR}" \
  --fetch-retries "${PNPM_FETCH_RETRIES}" \
  --fetch-retry-maxtimeout "${PNPM_FETCH_RETRY_MAX_TIMEOUT_MS}" \
  --fetch-timeout "${PNPM_FETCH_TIMEOUT_MS}"

echo "[atproto-dev-env] building atproto packages"
pnpm build

echo "[atproto-dev-env] starting local atproto dev environment"
cd packages/dev-env
exec bash ../dev-infra/with-test-redis-and-db.sh node --enable-source-maps dist/bin.js
