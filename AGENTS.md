# Git discipline

- **Semantic commit messages.** Use conventional commit prefixes (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `style:`, `perf:`, `ci:`, `build:`). Focus on what changed and why.
- **Commit frequently.** Small, focused commits reduce merge conflicts and make it easier to cherry-pick or revert.

# Local development

- For running Ozone locally against a sibling `atproto` sandbox, use `docs/local-development.md`. Prefer `make dev-stack-up` and `make dev-stack-smoke` for the coordinated Docker Compose workflow. Do not use the hosting Docker compose stack as the default local development path.
