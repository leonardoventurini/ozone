# Two Main Branch Topology

## Status

Accepted.

## Context

The repository needs one main branch that Leonardo owns for experiments and
integration, plus one main branch that stays synchronized with the canonical
Bluesky repository. Before this decision, local `main` pointed at the upstream
commit while tracking `origin/main`, which made the branch role ambiguous.

## Decision

Local `main` tracks `origin/main` on the fork and is the personal integration
branch. Local `upstream-main` tracks `upstream/main` and is the read-only mirror
of the Bluesky upstream baseline.

The repo-local git config also sets:

- `remote.pushDefault = origin`
- `branch.main.pushRemote = origin`
- `remote.upstream.pushurl = DISABLED`
- `branch.upstream-main.pushRemote = upstream`
- `pull.ff = only`

The operational runbook lives in `docs/git-branch-topology.md`.

## Alternatives Considered

- Keep `main` as the upstream mirror and create a separate personal branch.
  Rejected because the desired workflow is for the user-owned branch to be the
  primary `main`.
- Rename the fork remote away from `origin` and make `origin` point to Bluesky.
  Rejected because the existing repository convention already uses `origin` for
  the fork and `upstream` for Bluesky, matching common fork workflows.
- Use only short-lived feature branches off `upstream/main`. Rejected because
  this does not provide the requested persistent personal main branch.

## Consequences

- `main` can intentionally contain personal commits ahead of Bluesky upstream.
- `upstream-main` gives a stable local place to inspect, compare, and merge the
  canonical upstream state.
- Explicit pushes to `upstream` fail locally unless the disabled push URL is
  intentionally restored.
- Pulls are fast-forward-only by default, so unexpected divergence has to be
  handled deliberately.
- Upstream imports into personal `main` use explicit merges, preserving pushed
  fork history instead of rewriting it by default.

## Verification

Verify with:

```sh
git branch -vv
git config --get remote.pushDefault
git config --get pull.ff
git rev-list --left-right --count upstream-main...main
```
