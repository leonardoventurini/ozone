# Issue 472 Investigation: Moderation History Load More Failures

**Status:** Initialized
**Branch:** `fix/issue-472-moderation-history-load-more`
**Issue:** https://github.com/bluesky-social/ozone/issues/472
**Accessed:** 2026-07-07

## Problem Statement

Issue #472 reports that the "Moderation history of Entire account" view often
fails when moderators click "Load more" for large per-account event lists. The
reported backend error is:

```text
{"error":"InvalidRequest","message":"Error: uris/0 must be a valid at-uri"}
```

The reporter observed the failure in both the modal opened from report queues
and the full-page account view. The first page loads, then the next page often
fails at scale.

## Current Local Evidence

- `components/mod-event/useModEventList.tsx` owns moderation event pagination
  through `tools.ozone.moderation.queryEvents`.
- The same hook hydrates event subjects after each page fetch with
  `getRepos({ dids })` and `getRecords({ uris })`.
- `getRecords({ uris: chunk })` is the only local structural match for the
  bulk record hydration call shape.
- `ComAtprotoRepoStrongRef.isMain(event.subject)` is used as a type predicate
  before collecting `event.subject.uri`, but local runtime probing shows it is
  permissive: it can return true for objects whose `uri` is not a valid AT URI.
- `new AtUri(uri)` is also permissive for some non-record forms, such as DID-only
  or collection-only AT URIs. A guard for this issue must require a full record
  URI with authority, collection, and rkey.

## Likely Root Cause

The event query can return at least one historical, malformed, or custom event
whose subject has the `com.atproto.repo.strongRef` shape but whose `uri` is not
a valid full record AT URI. The frontend forwards that value into
`tools.ozone.moderation.getRecords({ uris })` during hydration. The backend then
validates `uris/0` strictly and rejects the whole hydration request, which makes
the page fetch appear to fail.

This matches the report because:

- the first page can load successfully if it does not include the malformed
  record subject;
- "Load more" can fail only when a later page includes one bad record URI;
- the failure is shared by modal and full-page history because both use the same
  moderation event list hook;
- "Whole Account" history increases the chance of encountering old or unusual
  record events.

## Files In Scope

- `components/mod-event/useModEventList.tsx`: collect only valid full record
  URIs for hydration and preserve event rendering when hydration is skipped.
- `components/mod-event/helpers/subject.tsx`: avoid throwing when deriving a
  subject title for malformed record refs.
- `lib/util.ts`: likely home for a reusable strict record AT URI guard if the
  helper is useful outside the moderation event list.
- `cypress/components/...`: add a regression test for mixed valid and malformed
  event subjects.

## Proposed Fix Shape

1. Add a typed helper that returns true only for valid full record AT URIs:
   authority present, collection present, and rkey present.
2. Use the helper before adding `event.subject.uri` to the `records` hydration
   map.
3. Use the helper before constructing `AtUri` for subject-author workspace
   extraction.
4. Make `getSubjectTitle` fall back to `Subject` for malformed record refs
   instead of throwing.
5. Keep the event itself visible even when its record preview cannot be
   hydrated.

## Verification Plan

- Add a focused component or helper-level regression test that builds a list of
  moderation events containing:
  - one valid record AT URI;
  - one invalid string such as `not-a-uri`;
  - one collection-only AT URI such as `at://did:plc:example/app.bsky.feed.post`.
- Assert that only the valid URI is sent to `getRecords`.
- Assert the rendered event list does not enter the error state when malformed
  record refs are present.
- Run:

```sh
yarn type-check
yarn cypress run --component --spec "cypress/components/path/to/new-test.cy.tsx"
```

## Risks

- If the malformed URI comes from the backend query itself rather than the
  frontend hydration pass, this frontend guard will prevent the UI crash but not
  repair stored event data.
- If moderators rely on workspace extraction from malformed historical events,
  skipping those subjects is preferable to blocking the entire bulk action, but
  it should be visible through ordinary event details where possible.
- A backend data repair or stricter event-emission validation may still be the
  long-term cleanup after the UI no longer fails.

## Non-Goals

- Do not change backend event storage or migration behavior in this branch.
- Do not hide malformed historical events from the moderation history.
- Do not broaden this into a redesign of account history pagination or report
  queues.

## Initial Recommendation

Proceed with the narrow frontend hardening first. It is low blast radius, covers
both failing surfaces, and can be verified with a deterministic regression test.
If later evidence shows malformed events are common, open a follow-up backend
cleanup issue for stored event validation and repair.
