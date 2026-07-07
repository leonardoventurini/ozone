# GitHub Issue Triage - 2026-07-06

This document captures a point-in-time triage of important open issues in
`bluesky-social/ozone`.

Issue state, labels, and release state can drift. Refresh the linked GitHub
issues before implementing any recommendation here.

## Source Method

- Repository: https://github.com/bluesky-social/ozone
- Access date: 2026-07-06
- Primary data source: `gh issue list` and `gh issue view` for open issues.
- Local code/documentation spot checks:
  - `Dockerfile`
  - `package.json`
  - `service/compose.yaml`
  - `HOSTING.md`
  - `app/actions/ModActionPanel/useQuickAction.tsx`
  - `components/config/external-labeler.tsx`
  - `components/common/Dropdown.tsx`
  - `components/subject/Summary.tsx`
  - `components/mod-event/helpers/emitEvent.tsx`
- External lifecycle sources:
  - Node.js release schedule:
    https://raw.githubusercontent.com/nodejs/Release/main/schedule.json
  - PostgreSQL versioning policy:
    https://www.postgresql.org/support/versioning/

## Severity Rubric

- **Critical:** likely security exposure, abuse vector, data loss, or legal risk.
- **High:** blocks real moderation work, makes maintenance unsafe, or risks
  stale production infrastructure.
- **Medium:** important accessibility, UX, or correctness issue with narrower
  blast radius.
- **Beginner target:** small local surface, deterministic behavior, clear test
  path, and low chance of requiring policy or architecture decisions.

## Executive Summary

The most severe unresolved work is not the best beginner work.

The highest-impact engineering target is the report-abuse/rate-limit cluster:
[#5](https://github.com/bluesky-social/ozone/issues/5) and
[#274](https://github.com/bluesky-social/ozone/issues/274). It is a public abuse
path that can overwhelm moderation queues, but it likely crosses backend policy,
storage, deployment, and privileged-bypass decisions.

The best beginner code target is
[#318](https://github.com/bluesky-social/ozone/issues/318), uppercase keyboard
shortcuts in the quick moderation action panel. It maps to a small frontend
hook, has deterministic behavior, and can be regression-tested.

The best beginner documentation target is the follow-up from
[#409](https://github.com/bluesky-social/ozone/issues/409): `HOSTING.md` still
instructs users to pull the `latest` image tag, while `service/compose.yaml`
runs `ghcr.io/bluesky-social/ozone:0.1`.

## Critical and High-Severity Issues

### #5 and #274 - Report Rate Limits and Queue Flooding

- Links:
  - https://github.com/bluesky-social/ozone/issues/5
  - https://github.com/bluesky-social/ozone/issues/274
- Severity: Critical
- Beginner suitability: Poor
- Last observed status:
  - #5 is labeled `backend` and asks for default per-account report limits and
    broader API rate limits.
  - #274 reports that a malicious account can flood a labeler moderation queue,
    and that muting the user does not stop reports from appearing.

What it entails:

- Add abuse controls for public or low-auth report submission paths.
- Decide default rate-limit windows and thresholds. #5 suggests roughly 200
  reports per account per day as a starting point, but that should be treated as
  a policy input, not a final contract.
- Preserve legitimate high-volume automation. Comments on #5 explicitly call
  out automod and firehose-based reporting workflows that may need a bypass
  based on auth or a special header.
- Add operator recovery for existing malicious reports. #274 asks for blocking
  reporters and flushing malicious reports from the database.
- Make failure modes visible to operators. Without metrics, a self-hoster may
  only notice the issue after the queue is already unusable.

Repo-local notes:

- This repo appears to contain the UI, deployment docs, Docker wrapper, and a
  `service/package.json` dependency on `@atproto/ozone`.
- The backend implementation for rate limits may live in the upstream
  `@atproto/ozone` package rather than in this repository directly.
- `lib/util.ts` contains client-side retry handling for rate-limit errors, but
  that is not the same as server-side abuse prevention.

Likely work:

- Locate the actual report creation endpoint in the backend package.
- Add default in-memory or configured rate limiting for self-hosters.
- Add privileged bypass semantics for trusted automation.
- Add tests for:
  - normal reporter below limit
  - reporter above limit
  - trusted automation bypass
  - muted or blocked reporter behavior
  - queue state after a flood attempt
- Update hosting/operator docs with knobs, defaults, and safe recovery steps.

Main risk:

- The wrong fix blocks legitimate moderation automation while failing to stop
  abuse. This needs a threat model and maintainer policy input.

### #258 - Granular Access Control

- Link: https://github.com/bluesky-social/ozone/issues/258
- Severity: Critical to High
- Beginner suitability: Poor
- Last observed status: A 2026-06-28 comment says this is actively blocking
  onboarding new moderators for XBlock.

What it entails:

- Restrict moderators to specific workstreams, such as subjects with recent
  reports of a given type.
- Restrict which labels or actions a moderator can apply.
- Enforce permissions server-side. UI-only filtering would be insufficient,
  because a user could still call actions outside the intended UI path.
- Keep the moderation workflow ergonomic. Per-label and per-queue restrictions
  must be understandable while taking action quickly.

Repo-local notes:

- Likely UI surfaces include `components/team/`, `components/config/Member.tsx`,
  `components/reports/QueueFilter/`, and the quick action panel under
  `app/actions/ModActionPanel/`.
- The server-side authority for ACL checks may live in the backend package, not
  only this UI repository.

Likely work:

- Define a permission model before implementation:
  - subject visibility
  - queue/report-type visibility
  - label application rights
  - action rights
  - bypass/admin rights
- Add backend authorization checks for every protected action.
- Add UI affordances that hide or disable forbidden controls with precise
  explanations.
- Add tests that prove forbidden actions fail even when attempted directly.

Main risk:

- Partial ACL creates a false sense of safety. Permission enforcement must be
  centralized and tested at the server boundary.

### #409 - Docker Image Vulnerable to CVE-2025-55182

- Link: https://github.com/bluesky-social/ozone/issues/409
- Severity: Critical historically; currently likely a release/documentation
  follow-up
- Beginner suitability: Medium for docs; poor for security verification
- Last observed status:
  - The issue reports exploited Docker deployments and cryptominer processes.
  - A maintainer comment says release `v0.1.101` was sent out.
  - `v0.1.101` release notes mention "Upgrade nextjs and react versions
    everywhere".
  - A later comment identifies a hosting docs mismatch: `HOSTING.md` tells
    users to pull `ghcr.io/bluesky-social/ozone:latest`, while the compose file
    uses `ghcr.io/bluesky-social/ozone:0.1`.

Repo-local notes:

- `package.json` currently has `next` `15.5.18`, `react` `19.2.5`, and
  `react-dom` `19.2.5`.
- `service/compose.yaml` uses `ghcr.io/bluesky-social/ozone:0.1` for both
  `ozone` and `ozone-daemon`.
- `HOSTING.md` still says:
  - `sudo docker pull ghcr.io/bluesky-social/ozone:latest`
- Pulling `latest` does not update a running compose service pinned to `0.1`.

Likely work:

- For a docs-only fix:
  - Change the manual update command in `HOSTING.md` to pull the same image tag
    used by `service/compose.yaml`.
  - Mention that users with customized compose files should pull the tag their
    compose file actually references.
- For security closure:
  - Verify the published image tag used by self-hosters contains the remediated
    dependency versions.
  - Run dependency and image vulnerability scanning.
  - Confirm release automation updates both `0.1` and any documented tag.

Main risk:

- Closing the issue after a docs fix alone would be premature unless the image
  contents and tag publishing path are verified.

### #507 - Node 20 Is End-of-Life

- Link: https://github.com/bluesky-social/ozone/issues/507
- Severity: High
- Beginner suitability: Medium to poor
- Last observed status: Open, no labels.

What it entails:

- Upgrade the runtime from Node 20 to a supported line.
- Official Node release schedule lists Node 20 (`Iron`) end-of-life as
  2026-04-30.
- Node 22 (`Jod`) is listed with end date 2027-04-30.
- Node 24 (`Krypton`) is listed with end date 2028-04-30.

Repo-local notes:

- `Dockerfile` uses `node:20.11-alpine3.18` in both build and final stages.
- `package.json` has:
  - `"engines": { "node": "20.x" }`
  - `"volta": { "node": "20.9.0" }`

Likely work:

- Pick the target Node line with maintainer agreement.
- Update `Dockerfile`, `package.json`, and Volta metadata together.
- Rebuild and run:
  - `yarn type-check`
  - `yarn build`
  - relevant Cypress smoke tests
  - Docker image build
- Check whether `service/package.json` and the packaged `@atproto/ozone`
  backend support the selected Node version.

Main risk:

- This looks mechanical, but runtime upgrades can break native modules,
  package-manager behavior, or production image builds. It needs full build and
  Docker verification.

### #470 - Postgres 14 Upgrade Path

- Link: https://github.com/bluesky-social/ozone/issues/470
- Severity: High
- Beginner suitability: Poor
- Last observed status: Open, no labels.

What it entails:

- Provide a safe migration path for self-hosters from Postgres 14 to a newer
  supported major version, likely 18 per the issue text and current PostgreSQL
  release table.
- Official PostgreSQL versioning page lists Postgres 14 final release as
  2026-11-12.
- The same page says major upgrades require dump/restore or `pg_upgrade`.

Repo-local notes:

- `service/compose.yaml` uses `postgres:14.11-bookworm`.
- Official PostgreSQL page lists the current Postgres 14 minor as `14.23` as of
  the access date, so the compose image is not just approaching major EOL; it is
  also behind the current minor line.

Likely work:

- Decide whether the project should recommend:
  - dump/restore
  - `pg_upgrade`
  - a new compose stack with explicit backup and restore steps
- Write a tested runbook:
  - stop Ozone
  - backup database
  - verify backup
  - perform upgrade
  - run migrations
  - verify health endpoint
  - rollback from backup if needed
- Add warnings around disk space, downtime, and failed migrations.

Main risk:

- Database upgrade mistakes can destroy a self-hoster's moderation state. This
  needs a tested path, not just an image tag change.

### #472 - Entire Account Moderation History Load More Fails

- Link: https://github.com/bluesky-social/ozone/issues/472
- Severity: High
- Beginner suitability: Medium to poor
- Last observed status: Open, no labels.

What it entails:

- In account views and modals, "Load More" for "Moderation history of entire
  account" frequently fails on large event lists.
- Reported error:
  - `InvalidRequest`
  - `Error: uris/0 must be a valid at-uri`
- A follow-up comment says the "Whole Account" event filter has the same
  problem and is almost useless at scale.

Repo-local notes:

- Likely UI/data surfaces include:
  - `components/mod-event/useModEventList.tsx`
  - `components/mod-event/FilterPanel.tsx`
  - `app/actions/ModActionPanel/QuickAction.tsx`
  - repository/account pages under `app/repositories/`
- The error suggests a DID/account identifier may be sent through a field that
  expects AT URIs, or pagination/filter state combines account and record
  subjects incorrectly.

Likely work:

- Capture or synthesize a failing request.
- Identify whether the bad `uris` value is generated by UI query state or by
  backend pagination.
- Add a regression test for account-level history pagination with mixed account
  and record subjects.
- Preserve both account-level and record-level event filtering semantics.

Main risk:

- The fix may require realistic data volume and mixed subject types to
  reproduce. Without that, a patch may only fix one visible request shape.

### #313 - Acknowledge All Does Not Consistently Ack Record Reports

- Link: https://github.com/bluesky-social/ozone/issues/313
- Severity: High
- Beginner suitability: Poor
- Last observed status: Open, no labels.

What it entails:

- Moderators expect an account-level acknowledge action with the "acknowledge
  all" checkbox to resolve open/escalated/appealed reports on subjects created
  by that account.
- The reporter describes intermittent cases where record reports remain in
  `requires-review`.
- When the bug does not trigger, related record moderation history gets an
  `AUTO_RESOLVE_ON_ACCOUNT_ACTION` entry. When it triggers, that entry is
  absent.

Repo-local notes:

- UI wiring likely involves:
  - `app/actions/ModActionPanel/useQuickAction.tsx`
  - `app/actions/ModActionPanel/QuickAction.tsx`
  - `components/workspace/PanelActionForm.tsx`
  - `components/mod-event/helpers/emitEvent.tsx`
- The real state transition and auto-resolution behavior may live in the
  backend package.

Likely work:

- Build a reproducible fixture with:
  - account report
  - record reports
  - mixed statuses
  - account already reviewed in the past
  - record reports created after prior review
- Trace the emitted event payload for both working and failing paths.
- Add an integration test around auto-resolve semantics.
- Confirm whether account-view entry and record-view "switch to account" entry
  produce different payloads.

Main risk:

- This is a state-machine correctness issue. A narrow UI change could hide the
  symptom while leaving unresolved reports in the database.

### #322 - PII Collection for Account Reinstatement and Privacy Policy

- Link: https://github.com/bluesky-social/ozone/issues/322
- Severity: High, non-code/legal
- Beginner suitability: Poor
- Last observed status: Open, no labels.

What it entails:

- The issue alleges that account reinstatement may collect government ID or
  other PII outside the stated privacy policy scope.
- It explicitly mentions possible exposure across US class-action and EU GDPR
  contexts.

Repo-local notes:

- This may not be primarily an Ozone code issue.
- The correct owner is likely legal/product/privacy policy, with engineering
  only implementing changes after policy decisions are made.

Likely work:

- Confirm whether Ozone owns any appeal or reinstatement flows that collect PII.
- Identify all code paths, forms, email templates, or docs that request identity
  documents.
- Route to legal/privacy owners before code changes.
- Add or update user-facing disclosures only after policy approval.

Main risk:

- Engineering should not independently decide legal basis, retention, or
  privacy-policy wording.

## Medium-Severity and High-Value Contributor Targets

### #310 - Report Count Colors Violate Accessibility Expectations

- Link: https://github.com/bluesky-social/ozone/issues/310
- Severity: Medium to High
- Beginner suitability: Medium
- Last observed status: Open, no labels.

What it entails:

- The original report says a report count badge used `bg-blue-400` with
  `text-blue-800`, producing insufficient WCAG contrast.
- A later comment says new colors pass WCAG AA but still fail AAA, and asks
  whether the project wants to address the photosensitive migraine concern
  caused by high-contrast moving color blocks in queue rows.

Repo-local notes:

- Possible badge locations include:
  - `components/subject/Summary.tsx`
  - `components/reports/ReportStatusBadge.tsx`
  - `components/reports/ReportActions.tsx`
  - `components/reports/stats/Stats.tsx`
- `components/subject/Summary.tsx` still contains
  `bg-blue-200 text-blue-800` for some count/status display.

Likely work:

- Identify the exact queue-view report count element.
- Decide whether the intended fix is:
  - AA contrast only
  - AAA contrast
  - remove colored background from queue rows
  - use semantic text with non-color indicators
- Add visual/accessibility checks for light and dark themes.

Main risk:

- A pure contrast fix may not address the motion/photosensitivity complaint.
  This needs product/design confirmation.

### #318 - Uppercase Keyboard Shortcuts Do Not Work

- Link: https://github.com/bluesky-social/ozone/issues/318
- Severity: Medium
- Beginner suitability: Best beginner code target
- Last observed status: Open, no labels.

What it entails:

- `(C)ancel`, `(S)ubmit`, and `Submit & (N)ext` only respond to lowercase
  `c`, `s`, and `n`.
- The button labels visually imply uppercase should work too.

Repo-local notes:

- `app/actions/ModActionPanel/useQuickAction.tsx` registers:
  - `useKeyPressEvent('c', safeKeyHandler(onCancel))`
  - `useKeyPressEvent('s', ...)`
  - `useKeyPressEvent('n', ...)`
- The same hook registers lowercase action-type shortcuts for `a`, `l`, `e`,
  and `t`.

Likely work:

- Normalize shortcut handling so unmodified uppercase and lowercase keys behave
  the same.
- Preserve existing guards:
  - ignore events from text inputs
  - ignore meta/ctrl/alt/shift combinations where appropriate
  - avoid duplicate submit behavior
- Add a Cypress regression test around uppercase `C`, `S`, and `N`.

Why it is the best beginner target:

- Single local code path.
- Deterministic behavior.
- Easy manual verification.
- Low product ambiguity.
- Teaches the contributor about the quick action panel without requiring
  backend knowledge.

### #304 - Documentation for Shutting Down an Ozone Server

- Link: https://github.com/bluesky-social/ozone/issues/304
- Severity: Medium
- Beginner suitability: Good documentation target
- Last observed status: Open, no labels.

What it entails:

- Add official guidance for decommissioning an Ozone server or labeler.
- The issue mentions community guidance around:
  - `npx @skywave/labeler clear`
  - checking with Label Scanner
- The requester may also delete the account entirely in their own case.

Repo-local notes:

- Likely home is `HOSTING.md`, perhaps a new "Shutting down Ozone" section near
  update/operations guidance.

Likely work:

- Confirm the recommended decommissioning path with maintainers before
  presenting third-party commands as official.
- Document:
  - how to stop containers
  - whether and how to clear labels
  - what happens to subscribers
  - whether the labeler service record should be updated or removed
  - backup/retention considerations

Main risk:

- Incorrect shutdown docs could cause accidental label deletion or leave stale
  service records visible to users.

### #312 - Filter Dropdown Appears Behind Video

- Link: https://github.com/bluesky-social/ozone/issues/312
- Severity: Medium
- Beginner suitability: Medium
- Last observed status: Open, no labels.

What it entails:

- In repository view, if the first post contains video, opening the post filter
  dropdown places the dropdown behind the video object.
- The dropdown becomes partially inaccessible.

Repo-local notes:

- `components/common/Dropdown.tsx` already has a comment that `z-50` is used so
  dropdowns draw over other page elements.
- Relevant media surfaces likely include:
  - `components/common/video/player.tsx`
  - `components/common/posts/Filter.tsx`
  - `components/common/posts/PostsFeed.tsx`
  - repository pages under `app/repositories/`

Likely work:

- Reproduce with a video post fixture.
- Inspect stacking contexts around the video player and dropdown.
- Fix the stacking context without raising the dropdown above modals or command
  palette.
- Add a Cypress visual or DOM-level regression if practical.

Main risk:

- z-index fixes can create new overlay bugs. The codebase already has comments
  about stack ordering, so this needs a careful local convention check.

### #168 - External Labeler Bio Line Breaks Are Not Preserved

- Link: https://github.com/bluesky-social/ozone/issues/168
- Severity: Medium
- Beginner suitability: Good UI target
- Labels: `bug`, `ui`
- Last observed status: Open.

What it entails:

- External labeler profile descriptions with line breaks render as a single
  block in Ozone, reducing readability.

Repo-local notes:

- `components/config/external-labeler.tsx` renders
  `{data.creator.description}` without an obvious whitespace-preserving class.
- The codebase already uses `whitespace-pre-wrap` in several places for
  comments and descriptions.

Likely work:

- Apply the existing whitespace-preserving pattern to external labeler
  descriptions.
- Verify long descriptions still wrap and do not overflow.
- Add a component or Cypress test if the surrounding test setup supports the
  component.

Main risk:

- Low. The main concern is avoiding layout overflow for long profile text.

## Important Issues Not Recommended as First Targets

### #421 - External Labeler Search Shows Accounts That Are Not Labelers

- Link: https://github.com/bluesky-social/ozone/issues/421
- Severity: Medium
- Beginner suitability: Medium to poor

Why it matters:

- In settings, the labeler DID input can return ordinary accounts when users
  search for an external labeler.
- Selecting a non-labeler in a labeler config is confusing and may produce a
  broken integration.

Why it is not the first target:

- The fix likely depends on appview/profile metadata semantics for identifying
  labelers, not just local UI filtering.

### #460 - Cannot Choose Report Subcategories in Settings

- Link: https://github.com/bluesky-social/ozone/issues/460
- Severity: Medium to High
- Beginner suitability: Poor

Why it matters:

- Labelers can choose broad report categories in settings but not newer report
  subcategories, such as animal abuse or ban evasion.
- This limits specialization for moderators and labeler operators.

Why it is not the first target:

- It likely requires understanding the current report taxonomy, configuration
  persistence, UI settings, and any backend expectations around report reasons.

### #525 and #4 - Observability and Backend Metrics

- Links:
  - https://github.com/bluesky-social/ozone/issues/525
  - https://github.com/bluesky-social/ozone/issues/4
- Severity: Medium to High
- Beginner suitability: Poor

Why it matters:

- Operators want visibility into moderation decisions, queue lengths, report
  counts, and alertable patterns.
- #525 explicitly frames observability as useful while granular ACL work remains
  unresolved.

Why it is not the first target:

- Good observability requires stable event semantics, metric cardinality
  discipline, deployment/security decisions for metrics endpoints, and operator
  documentation.

## Recommended Beginner Targets

Start here:

1. #318 - uppercase keyboard shortcuts.
   - Best first code contribution.
   - Likely one hook plus one regression test.
   - Clear pass/fail behavior.

2. #168 - external labeler bio line breaks.
   - Good UI polish contribution.
   - Likely a small styling change using an existing codebase pattern.

3. #409 documentation follow-up.
   - Good docs contribution if scoped only to the `latest` versus `0.1` image
     mismatch.
   - Do not claim the full CVE issue is resolved without image verification.

4. #304 shutdown documentation.
   - Good docs contribution after maintainer confirmation on the official
     decommissioning flow.

Avoid as first targets:

- #5/#274: high-value but backend abuse/security work.
- #258: product-wide authorization model.
- #470: database upgrade runbook and data-loss risk.
- #313: intermittent state-machine correctness.
- #322: legal/privacy ownership.

## Suggested Next-Step Plans

### Beginner Code Path: #318

1. Add a failing Cypress test for uppercase `C`, `S`, and `N` in the quick
   moderation action panel.
2. Update `app/actions/ModActionPanel/useQuickAction.tsx` so shortcut handling
   is case-insensitive for unmodified key events.
3. Run the targeted Cypress test.
4. Run `yarn type-check`.
5. Confirm lowercase shortcuts still work.

### Beginner Docs Path: #409 Follow-Up

1. Update the manual pull command in `HOSTING.md` to use the compose image tag:
   `ghcr.io/bluesky-social/ozone:0.1`.
2. Add one sentence explaining that custom compose files should pull the tag
   they reference.
3. Check all `ghcr.io/bluesky-social/ozone` mentions for consistency.
4. Run a docs diff review.

### Serious Engineering Path: #5/#274

1. Locate the backend report submission endpoint in the actual service package.
2. Write a threat model for queue flooding.
3. Define rate-limit contracts and trusted automation bypasses.
4. Add backend tests first.
5. Add metrics or logs for limit hits.
6. Document configuration and recovery.

## Research Caveats

- GitHub issue labels are incomplete. Several severe issues are unlabeled.
- Some backend work may live outside this repository in the packaged
  `@atproto/ozone` service.
- The #409 vulnerability appears partially remediated by release history, but
  this document does not independently verify every published Docker image.
- Legal/privacy conclusions in #322 require owner review outside engineering.
- Accessibility issues such as #310 may need design/product confirmation before
  implementation because "passes contrast" and "does not trigger motion or
  photosensitivity issues" are related but different goals.
