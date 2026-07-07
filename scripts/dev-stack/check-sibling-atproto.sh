#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
atproto_root="$(cd "${repo_root}/.." && pwd)/atproto"

if [[ ! -f "${atproto_root}/package.json" ]]; then
  cat >&2 <<EOF
Missing sibling atproto checkout.

Expected: ${atproto_root}

Clone it next to this repository:

  cd "$(dirname "${repo_root}")"
  git clone https://github.com/bluesky-social/atproto.git
EOF
  exit 1
fi

if [[ ! -f "${atproto_root}/packages/dev-env/package.json" ]]; then
  cat >&2 <<EOF
The sibling atproto checkout does not look complete.

Expected: ${atproto_root}/packages/dev-env/package.json
EOF
  exit 1
fi
