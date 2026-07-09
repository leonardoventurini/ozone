# Issue 472 Vitest and URI Guard Decision

**Date:** 2026-07-07
**Status:** Accepted
**Implementation commit:** `59ebbde`

## Context

Issue #472 reports moderation history pagination failures when the UI loads
more account-wide history and the backend rejects bulk record hydration with
`uris/0 must be a valid at-uri`.

Local investigation showed the UI collected record hydration targets with
`ComAtprotoRepoStrongRef.isMain(event.subject)`. That generated type guard
accepts record-shaped objects even when `subject.uri` is malformed or only a
collection-level AT URI.

## Decisions

- Add plain Vitest as a fast unit-test lane for pure data contracts.
- Keep Cypress as the browser/component/e2e runner and do not add Vitest Browser
  Mode for this issue.
- Add `@atproto/syntax` as a direct runtime dependency before importing its AT
  URI parser from application code.
- Treat only syntactically valid AT URIs with both `collection` and `rkey` as
  record hydration targets.
- Preserve malformed moderation history events and skip only unsafe record
  preview hydration.

## Evidence

- `components/mod-event/hydration.test.ts` reproduced the failure by mocking
  `getRecords` to reject when malformed strongRef URIs reached the payload.
- The red test failed with `Error: uris/0 must be a valid at-uri` before the
  hydration guard was applied.
- `npm exec --yes --package=@yarnpkg/cli-dist@4.8.1 yarn -- test:unit` passed
  with 3 files and 6 tests.
- `npm exec --yes --package=@yarnpkg/cli-dist@4.8.1 yarn -- type-check` passed.
- `ast-grep` confirmed the only bulk `getRecords` call now lives in
  `components/mod-event/hydration.ts`.

## Consequences

Moderation history can continue loading when old or custom events contain bad
record-shaped subjects. Those events remain visible; only their unsafe record
preview hydration is omitted.

