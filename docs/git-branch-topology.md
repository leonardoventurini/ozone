# Git Branch Topology

This repository uses two local main branches with different ownership:

- `main` is Leonardo's integration branch. It tracks `origin/main` on the
  `leonardoventurini/ozone` fork and is the branch where personal experiments
  and local integration work can land.
- `upstream-main` is a local mirror of Bluesky's canonical `upstream/main`.
  Treat it as read-only. Its job is to show the exact upstream baseline without
  personal commits mixed in.

## Remotes

- `origin`: `https://github.com/leonardoventurini/ozone.git`
- `upstream`: `https://github.com/bluesky-social/ozone.git`

Repo-local guardrails:

- `remote.pushDefault = origin` keeps default pushes pointed at the fork.
- `branch.main.pushRemote = origin` keeps `main` pushes pointed at the fork.
- `pull.ff = only` makes `git pull` fail instead of silently creating merge
  commits when histories have diverged.

## Refresh Remote State

Fetch and prune before comparing or synchronizing either branch:

```sh
git fetch --all --prune
```

## Keep The Upstream Mirror Current

Use fast-forward-only updates for the upstream mirror:

```sh
git switch upstream-main
git pull --ff-only
```

Do not commit personal work on `upstream-main`. If it ever has local commits,
stop and inspect the branch before resetting or rebasing it.

## Keep Personal Main Current With The Fork

Use fast-forward-only pulls for the personal main branch:

```sh
git switch main
git pull --ff-only
```

Push personal main explicitly to the fork:

```sh
git push origin main
```

## Bring Upstream Into Personal Main

When Bluesky upstream advances and you want those changes in your personal
main, make the upstream import an explicit operation:

```sh
git fetch --all --prune
git switch upstream-main
git pull --ff-only
git switch main
git merge upstream-main
```

Run the relevant project checks after the merge, resolve conflicts on `main`,
then push the result to `origin/main` when it is ready.

## Verify The Topology

Use these commands when the branch roles are in doubt:

```sh
git branch -vv
git config --get remote.pushDefault
git config --get pull.ff
git rev-list --left-right --count upstream-main...main
```

For the divergence command, the first number is commits only on
`upstream-main`; the second number is commits only on personal `main`.
