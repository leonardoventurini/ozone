#!/usr/bin/env bash
set -euo pipefail

timeout_seconds="${DEV_STACK_SMOKE_TIMEOUT_SECONDS:-180}"

wait_for_url() {
  local name="$1"
  local url="$2"

  echo "[smoke] waiting for ${name}: ${url}"
  node - "${name}" "${url}" "${timeout_seconds}" <<'NODE'
const [name, url, timeoutSecondsRaw] = process.argv.slice(2)
const timeoutMs = Number(timeoutSecondsRaw) * 1000
const startedAt = Date.now()

async function waitForUrl() {
  let lastStatus = 'no response'

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const res = await fetch(url)
      lastStatus = `${res.status} ${res.statusText}`
      if (res.ok) {
        process.exit(0)
      }
    } catch (err) {
      lastStatus = err instanceof Error ? err.message : String(err)
    }

    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  console.error(`[smoke] ${name} did not become ready at ${url}: ${lastStatus}`)
  process.exit(1)
}

waitForUrl()
NODE
}

json_field() {
  local url="$1"
  local expression="$2"

  node - "${url}" "${expression}" <<'NODE'
const [url, expression] = process.argv.slice(2)

function readPath(value, path) {
  return path.split('.').reduce((current, key) => {
    if (current && typeof current === 'object' && key in current) {
      return current[key]
    }
    return undefined
  }, value)
}

async function main() {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`${url} returned ${res.status}`)
  }
  const data = await res.json()
  const value = readPath(data, expression)
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`${expression} was not a non-empty string`)
  }
  console.log(value)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})
NODE
}

wait_for_url "introspection" "http://localhost:2581/"
ozone_did="$(json_field "http://localhost:2581/" "ozone.did")"

wait_for_url "PLC Ozone DID document" "http://localhost:2582/${ozone_did}/data"
wait_for_url "PDS health" "http://localhost:2583/xrpc/_health"
wait_for_url "AppView health" "http://localhost:2584/xrpc/_health"
wait_for_url "Ozone health" "http://localhost:2587/xrpc/_health"
wait_for_url "Ozone metadata" "http://localhost:2587/.well-known/ozone-metadata.json"
wait_for_url "Ozone UI" "http://localhost:3000"

echo "[smoke] dev stack is ready"
