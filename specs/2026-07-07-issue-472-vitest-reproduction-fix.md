# Issue 472 Vitest Reproduction Fix - Campaign Plan

> For agentic workers: Execute task-by-task in the current session by default.
> Steps use checkbox syntax for tracking.

**Goal:** Add a narrow plain-Vitest unit test lane that reproduces issue #472
and fix moderation history pagination so malformed record subjects cannot fail
bulk record hydration.
**Cynefin classification:** Complicated.
**Intensity tier:** Raid - test infrastructure plus a user-visible bugfix in
the moderation event history path.
**RFC mode:** internal. Cortex and subagent tools are not exposed in this
session.
**Delegation profile:** local only - the critical path is a small set of shared
files.
**Model/cost profile:** inherit by default; no subagent lanes.
**Cortex context:** unavailable in this session; local `rg`, `ast-grep`, file
reads, and official documentation were used instead.
**Architecture:** Keep Cypress as the browser/e2e runner. Add plain Vitest for
fast unit-level regression tests, then move moderation event subject hydration
behind a tested helper that only sends valid full record AT URIs to
`getRecords`.
**Tech stack:** Next.js 15.5.18, React 19.2.5, TypeScript 5.4, Yarn 4.8.1,
Vitest, Vite React plugin, Vite TSConfig paths, `@atproto/syntax`.
**Parallelism profile:** single-lane - package metadata, test config, and the
hydration fix converge in the same module.
**Design context source:** n/a.
**Repository context:** structural-search needed; `ast-grep` verified the
single bulk `getRecords` call shape.

**Shadow Team Assignments:**
- Bellion [Strategist]: plan integrity, RFC self-review, and rollout gate.
- Beru [Auditor->Executor]: local repository reconnaissance and structural
  search.
- Greed [Executor]: package manager, Vitest config, and script integration.
- Kamish [Architect]: helper boundary and module contracts.
- Fangs [Auditor]: failing regression, verification ladder, and test adequacy.
- Tank [Auditor]: rollback and dependency-blast-radius review.
- Igris [Executor]: implementation quality and documentation clarity.
- Mimir [Architect->Auditor]: official Next/Vitest source check for test-runner
  claims.
- Munger [Strategist]: inversion pass for overbuilding the test stack.
- Memetar [Executor]: syntax-aware search confirmation.
- Hypatia / Tusk / Iron / Kaisel: n/a - no algorithmic state machine,
  formal-methods need, performance budget, or production telemetry change.
- Codex Subagents: n/a - no bounded file-disjoint lane available.

## Munger Memo

**Inversion:** This fails if we build browser test infrastructure that does not
exercise the actual failing contract, or if the fix hides moderation history
events instead of skipping only unsafe hydration.
**Incentive map:** Maintainers want confidence without slow tests; moderators
need the page to keep loading even when old data is malformed; the tempting
shortcut is to test rendered UI while leaving URI collection unproven.
**Standard Stupidities in play:** Complexity worship, authority deference to a
new tool, and false confidence from tests that never inspect the XRPC payload.
**Circle of competence:** In - the failing local files, generated type guards,
and parser APIs were verified locally.
**Verdict:** Green with caveat - use plain Vitest for the exact contract and do
not migrate or duplicate Cypress coverage.

## Clarity Pass

Issue #472 is not fundamentally a browser-rendering bug. The moderation history
query returns events, then the UI tries to hydrate record subjects in bulk. One
bad `com.atproto.repo.strongRef` shape can place a bad `uri` into
`tools.ozone.moderation.getRecords({ uris })`, and the backend rejects the
whole request. The fix is to test and enforce a simple contract: only full,
valid record AT URIs go into `getRecords`; malformed or collection-only subjects
still render as history events, just without record preview hydration.

Concrete example:

1. Query returns three record-shaped event subjects:
   `at://did:plc:alice/app.bsky.feed.post/3kabc`, `not-a-uri`, and
   `at://did:plc:alice/app.bsky.feed.post`.
2. The hydration helper keeps only the first value for `getRecords`.
3. The mock backend no longer throws `uris/0 must be a valid at-uri`.
4. The list maps the valid record preview where available and leaves the
   malformed historical event visible.

## Research Brief

**Research questions:**
- What does the current Next.js documentation recommend for Vitest setup?
- When is Vitest Browser Mode appropriate, and is it required here?

**Source hierarchy:** Official framework documentation first; local source and
generated package typings are used for repository-specific contracts.

**Claim ledger:**
- Claim: Next.js documents Vitest as a unit-testing option and shows manual
  setup with `vitest`, `@vitejs/plugin-react`, `jsdom`,
  `@testing-library/react`, `@testing-library/dom`, and `vite-tsconfig-paths`.
  Source: <https://nextjs.org/docs/app/guides/testing/vitest>
  Evidence type: official documentation.
  Accessed: 2026-07-07.
  Confidence: high.
  Notes: This plan intentionally installs the subset needed for pure unit tests
  now and leaves jsdom/Testing Library for the first DOM unit test.
- Claim: Vitest Browser Mode runs tests in real browsers and is positioned for
  browser/component accuracy.
  Source: <https://vitest.dev/guide/browser/>
  Evidence type: official documentation.
  Accessed: 2026-07-07.
  Confidence: high.
  Notes: That accuracy is not load-bearing for a URI-filtering contract.
- Claim: Vitest component testing docs recommend Browser Mode for component
  testing accuracy.
  Source: <https://vitest.dev/guide/browser/component-testing>
  Evidence type: official documentation.
  Accessed: 2026-07-07.
  Confidence: high.
  Notes: This reinforces keeping Cypress for current browser coverage and
  avoiding a second browser stack for issue #472.

**Citation pack:**
- Next.js, "How to set up Vitest with Next.js", last updated 2026-02-11,
  accessed 2026-07-07:
  <https://nextjs.org/docs/app/guides/testing/vitest>
- Next.js, "Guides: Testing", accessed 2026-07-07:
  <https://nextjs.org/docs/app/guides/testing>
- Vitest, "Browser Mode", accessed 2026-07-07:
  <https://vitest.dev/guide/browser/>
- Vitest, "Browser Mode for Component Testing", accessed 2026-07-07:
  <https://vitest.dev/guide/browser/component-testing>

**Recency horizon:** Re-check these docs before changing test-runner strategy or
upgrading Next/Vitest major versions.
**Conflicting evidence:** None for this scope. Browser Mode is better for real
browser component fidelity, but the issue #472 contract is pure data handling.
**Unsupported claims:** No runtime browser behavior claim is used to justify the
fix.
**Open questions:** None that block direct execution.

## ADRs

### ADR-001: Add plain Vitest, not Vitest Browser Mode

**Status:** Accepted.
**Date:** 2026-07-07.
**Deciders:** Mimir, Fangs, Greed, Bellion.

**Context:** The issue is caused by an unsafe XRPC hydration payload, not CSS,
focus, browser APIs, or real DOM behavior. The repo already has Cypress for
browser and component coverage.

**Decision:** Add a plain Vitest unit lane with Vite alias support. Configure
the default environment as `node` and keep Browser Mode out of scope.

**Alternatives considered:** Vitest Browser Mode; rejected because it adds a
second browser stack and does not improve confidence for URI filtering.
Cypress component test; rejected for this regression because it would be slower
and would still need mocks to observe the XRPC payload. Jest; rejected because
Vitest integrates cleanly with Vite-style alias resolution and was the user's
chosen direction.

**Consequences:** The regression runs quickly and can assert exact helper and
mock-agent behavior. Future DOM unit tests may add jsdom and Testing Library
when there is a concrete component test that needs them.

### ADR-002: Treat `@atproto/syntax` as a direct runtime dependency

**Status:** Accepted.
**Date:** 2026-07-07.
**Deciders:** Kamish, Greed, Igris.

**Context:** `@atproto/syntax` is currently present transitively, and its
`parseAtUriString` API can validate AT URI syntax. Importing transitive
dependencies from application code is a hidden package contract.

**Decision:** Add `@atproto/syntax` to `dependencies` before importing it from
runtime UI code.

**Alternatives considered:** Keep using the local `parseAtUri` regex helper;
rejected because it accepts strings the authoritative parser rejects. Use
`new AtUri(uri)` from `@atproto/api`; rejected because it is not sufficient for
the `getRecords` contract and can accept collection-only URIs. Import the
transitive dependency without declaring it; rejected as lockfile fragility.

**Consequences:** The runtime dependency graph becomes explicit. The helper can
require both parser success and the presence of `collection` plus `rkey`.

### ADR-003: Extract moderation event hydration into a tested helper

**Status:** Accepted.
**Date:** 2026-07-07.
**Deciders:** Kamish, Fangs, Igris.

**Context:** `useModEventList.tsx` currently combines React state, query
construction, event pagination, hydration collection, and workspace actions.
Testing the hook through React would obscure the payload contract.

**Decision:** Move `getReposAndRecordsForEvents` into
`components/mod-event/hydration.ts` and export it with a small pure helper for
collecting hydration targets.

**Alternatives considered:** Export the existing private function from the hook
file; rejected because importing the hook file pulls more React/query context
than the regression needs. Test only `isFullRecordAtUri`; rejected because it
does not prove `getRecords` receives safe payloads.

**Consequences:** The failing behavior can be reproduced with a mock
`Agent.tools.ozone.moderation.getRecords` function. The hook becomes thinner
without changing user-visible behavior.

### ADR-004: Preserve malformed history events and skip unsafe hydration

**Status:** Accepted.
**Date:** 2026-07-07.
**Deciders:** Tank, Fangs, Bellion.

**Context:** Moderation history is evidence. A malformed historical subject
should not make the whole list fail, but it also should not disappear.

**Decision:** Keep events in the returned list even when their record subject
cannot be hydrated. Skip only invalid or incomplete record URIs when calling
`getRecords`, deriving subject titles, or deriving subject-author workspace
items.

**Alternatives considered:** Drop malformed events; rejected because it hides
history. Show a toast for every malformed subject; rejected because the common
case could become noisy and the event details remain visible. Retry hydration
one URI at a time; rejected because it preserves backend load and does not fix
the invalid input contract.

**Consequences:** The user can continue paging through history. Record previews
are absent only for malformed or non-record subjects that could not be safely
hydrated.

## Praemeditatio Malorum

- **Failure mode:** The test lane grows into a second browser infrastructure.
  **Why it matters:** It slows local verification and duplicates existing
  Cypress coverage without proving the failing XRPC contract.
  **Mitigation:** ADR-001 limits the initial lane to plain Vitest with a node
  environment.
  **Detection:** `vitest.config.ts` has no browser provider config and
  `package.json` has only a unit-test script.
  **Recovery:** Remove browser-mode dependencies/config before committing.

- **Failure mode:** The regression only tests URI parsing and not the actual
  `getRecords` payload.
  **Why it matters:** A future refactor could still forward invalid URIs while
  the parser helper remains correct.
  **Mitigation:** Task 2 tests `getReposAndRecordsForEvents` with a mock agent
  that throws on invalid `uris`.
  **Detection:** `npm exec --yes --package=@yarnpkg/cli-dist@4.8.1 yarn --
  test:unit components/mod-event/hydration.test.ts`.
  **Recovery:** Add a mock-agent assertion before accepting the fix.

- **Failure mode:** Collection-only AT URIs pass syntax validation and still
  reach `getRecords`.
  **Why it matters:** `getRecords` needs record URIs, not repository or
  collection references.
  **Mitigation:** `isFullRecordAtUri` requires parser success plus `collection`
  and `rkey`.
  **Detection:** Unit test includes
  `at://did:plc:alice/app.bsky.feed.post` and expects it to be skipped.
  **Recovery:** Tighten the helper contract and rerun type/unit checks.

- **Failure mode:** A malformed subject still throws while rendering titles or
  adding subject authors to a workspace.
  **Why it matters:** The history list could load but a secondary interaction
  could still fail on the same data shape.
  **Mitigation:** Task 3 applies the same guard to `getSubjectTitle` and the
  subject-author branch.
  **Detection:** Unit test covers `getSubjectTitle` fallback; typecheck covers
  the workspace path.
  **Recovery:** Route all `new AtUri(event.subject.uri)` calls touched by this
  path through `isFullRecordAtUri` or `getDidFromUri`.

- **Failure mode:** Package-manager changes drift from the Yarn 4 lockfile.
  **Why it matters:** CI and other developers may install different dependency
  graphs.
  **Mitigation:** Use Yarn 4.8.1 for all dependency changes. In this shell, the
  verified fallback invocation is
  `npm exec --yes --package=@yarnpkg/cli-dist@4.8.1 yarn --`.
  **Detection:** `git diff -- package.json yarn.lock` shows coherent manifest
  and lockfile updates.
  **Recovery:** Re-run the dependency command with Yarn 4.8.1 and discard only
  task-owned package metadata edits if needed.

## File Structure

- `specs/2026-07-07-issue-472-vitest-reproduction-fix.md`: this direct-rollout
  plan and execution ledger.
- `package.json`: add unit-test scripts and explicit dependency metadata.
- `yarn.lock`: Yarn 4 lockfile updates for Vitest and `@atproto/syntax`.
- `vitest.config.ts`: plain Vitest config with existing TypeScript path aliases.
- `lib/util.ts`: add a documented `isFullRecordAtUri` guard using
  `parseAtUriString`.
- `lib/util.test.ts`: unit tests for full-record AT URI validation.
- `components/mod-event/hydration.ts`: exported moderation event hydration
  target collection and XRPC hydration helper.
- `components/mod-event/hydration.test.ts`: issue #472 regression proving bad
  record-shaped subjects do not reach `getRecords`.
- `components/mod-event/useModEventList.tsx`: consume the hydration helper and
  guard subject-author DID extraction.
- `components/mod-event/helpers/subject.tsx`: fall back to `Subject` for
  malformed record refs.
- `components/mod-event/helpers/subject.test.ts`: regression proving malformed
  strong refs do not throw while deriving titles.
- `decisions/2026-07-07-issue-472-vitest-and-uri-guard.md`: post-implementation
  decision summary if the implementation follows this plan materially.

## Invariant Matrix

- **Invariant 1:** `getRecords` is called only with valid full record AT URIs.
  **Scope:** `components/mod-event/hydration.ts`.
  **Verified by:** `components/mod-event/hydration.test.ts`.
  **Type:** unit.
- **Invariant 2:** Malformed record-shaped subjects remain in event results
  rather than rejecting the page fetch.
  **Scope:** `getReposAndRecordsForEvents`.
  **Verified by:** mock-agent unit test.
  **Type:** unit.
- **Invariant 3:** `getSubjectTitle` never throws for a strongRef shape with an
  invalid or incomplete URI.
  **Scope:** `components/mod-event/helpers/subject.tsx`.
  **Verified by:** `components/mod-event/helpers/subject.test.ts`.
  **Type:** unit.
- **Invariant 4:** Runtime code does not import undeclared package dependencies.
  **Scope:** `package.json` and imports.
  **Verified by:** dependency diff and `yarn type-check`.
  **Type:** type/package.

## Slices

1. **Spec and preflight** - Tasks: 1 - checkpoint:
   `git status --short`.
2. **Plain Vitest lane** - Tasks: 2 - checkpoint:
   `npm exec --yes --package=@yarnpkg/cli-dist@4.8.1 yarn -- test:unit`.
3. **Issue reproduction and fix** - Tasks: 3, 4, 5 - checkpoint:
   `npm exec --yes --package=@yarnpkg/cli-dist@4.8.1 yarn -- test:unit`.
4. **Final validation and archive** - Tasks: 6 - checkpoint:
   `npm exec --yes --package=@yarnpkg/cli-dist@4.8.1 yarn -- type-check`.

## Tasks

### Task 1: Commit the plan

**Files:** Create:
`specs/2026-07-07-issue-472-vitest-reproduction-fix.md`.

**Execution:**
- Owner: current session (Crown: Executor).
- Support: Bellion, Igris.
- Auditor: Bellion.
- Delegation packet: local.
- Cortex packet: n/a - Cortex tools unavailable.
- Risk: low.
- Risk basis: documentation-only change on a clean branch.
- Main uncertainty: none.
- Blast radius: repository planning artifact only.
- Parallel-safe with: sequential.
- Verification rung: type/document review.
- Verification command: `git status --short`.
- Integration gate: review the spec for placeholder terms and exact commands.
- Rollback command: `git rm specs/2026-07-07-issue-472-vitest-reproduction-fix.md`.
- Definition of Done: spec exists, has no placeholder sections, and is
  committed with a conventional message.

- [ ] **Step 1: Review current worktree** -
  `git status --short --branch`.
- [ ] **Step 2: Create this spec** - write the campaign plan.
- [ ] **Step 3: Review placeholder and command quality** -
  `rg -n "T(BD)|TO(DO)|implement la(ter)|appropriate error handl(ing)" specs/2026-07-07-issue-472-vitest-reproduction-fix.md`.
- [ ] **Step 4: Commit** -
  `git add specs/2026-07-07-issue-472-vitest-reproduction-fix.md && git commit -m "docs: spec issue 472 vitest reproduction fix"`.

### Task 2: Add plain Vitest infrastructure

**Files:** Modify: `package.json`, `yarn.lock`. Create:
`vitest.config.ts`.

**Execution:**
- Owner: current session (Crown: Executor).
- Support: Greed, Fangs.
- Auditor: Tank.
- Delegation packet: local.
- Cortex packet: n/a.
- Risk: medium.
- Risk basis: dependency graph and lockfile changes can affect install and CI;
  the test runner is otherwise isolated behind a new script.
- Main uncertainty: whether current shell exposes direct `yarn`; fallback was
  verified with `npm exec --yes --package=@yarnpkg/cli-dist@4.8.1 yarn --`.
- Blast radius: package install metadata and local test command.
- Parallel-safe with: sequential.
- Verification rung: package/type.
- Verification command:
  `npm exec --yes --package=@yarnpkg/cli-dist@4.8.1 yarn -- test:unit`.
- Integration gate: verify no Browser Mode dependencies or config were added.
- Rollback command:
  `git restore -- package.json yarn.lock && rm -f vitest.config.ts`.
- Definition of Done: `test:unit` exists, Vitest can start, and config resolves
  existing TypeScript aliases.

- [ ] **Step 1: Add dev dependencies through Yarn 4.8.1** -
  `npm exec --yes --package=@yarnpkg/cli-dist@4.8.1 yarn -- add -D vitest @vitejs/plugin-react vite-tsconfig-paths`.
- [ ] **Step 2: Add runtime parser dependency through Yarn 4.8.1** -
  `npm exec --yes --package=@yarnpkg/cli-dist@4.8.1 yarn -- add @atproto/syntax`.
- [ ] **Step 3: Add scripts to `package.json`** -
  `test:unit` runs `vitest run`; `test:unit:watch` runs `vitest`.
- [ ] **Step 4: Create `vitest.config.ts`**:

```ts
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'node',
    exclude: ['node_modules', '.next', 'cypress'],
    include: ['**/*.test.ts', '**/*.test.tsx'],
  },
})
```

- [ ] **Step 5: Run the empty or existing unit lane** -
  `npm exec --yes --package=@yarnpkg/cli-dist@4.8.1 yarn -- test:unit`;
  if Vitest exits only because no tests exist, proceed to Task 3 before
  committing the infra.

### Task 3: Reproduce issue #472 with a failing Vitest regression

**Files:** Create: `components/mod-event/hydration.ts`,
`components/mod-event/hydration.test.ts`, `lib/util.test.ts`.
Modify: `components/mod-event/useModEventList.tsx` only enough to import from
the extracted helper.

**Execution:**
- Owner: current session (Crown: Executor).
- Support: Fangs, Kamish.
- Auditor: Bellion.
- Delegation packet: local.
- Cortex packet: n/a.
- Risk: medium.
- Risk basis: extracting a private helper can accidentally change behavior;
  the failing test anchors the contract before the fix.
- Main uncertainty: generated lexicon typings may require minor fixture shape
  adjustment.
- Blast radius: moderation event pagination helper.
- Parallel-safe with: sequential.
- Verification rung: unit.
- Verification command:
  `npm exec --yes --package=@yarnpkg/cli-dist@4.8.1 yarn -- test:unit components/mod-event/hydration.test.ts`.
- Integration gate: red test must fail because invalid record-shaped subject
  reaches mocked `getRecords`, not because imports or fixtures are broken.
- Rollback command:
  `git restore -- components/mod-event/useModEventList.tsx && rm -f components/mod-event/hydration.ts components/mod-event/hydration.test.ts lib/util.test.ts`.
- Definition of Done: the failing test reproduces the backend validation error
  with malformed and collection-only record-shaped subjects.

- [ ] **Step 1: Extract the helper with current permissive behavior** -
  `getModEventHydrationTargets` initially adds every
  `ComAtprotoRepoStrongRef.isMain(event.subject)` URI to `recordUris`.
- [ ] **Step 2: Write parser tests that express the desired guard contract** -
  invalid strings and collection-only AT URIs return `false`; full record AT
  URIs return `true`.
- [ ] **Step 3: Write the mock-agent reproduction** - the mock
  `getRecords({ uris })` throws `Error: uris/0 must be a valid at-uri` when any
  URI fails `isFullRecordAtUri`, and the test expects the helper to resolve
  after filtering.
- [ ] **Step 4: Run the test and capture the red result** -
  `npm exec --yes --package=@yarnpkg/cli-dist@4.8.1 yarn -- test:unit components/mod-event/hydration.test.ts lib/util.test.ts`.
- [ ] **Step 5: Confirm failure reason** - the red test must mention the
  mocked invalid `uris` path, not a TypeScript transform or module-resolution
  error.

### Task 4: Fix hydration and defensive parsing

**Files:** Modify: `lib/util.ts`, `components/mod-event/hydration.ts`,
`components/mod-event/useModEventList.tsx`,
`components/mod-event/helpers/subject.tsx`.
Create: `components/mod-event/helpers/subject.test.ts`.

**Execution:**
- Owner: current session (Crown: Executor).
- Support: Igris, Kamish.
- Auditor: Fangs.
- Delegation packet: local.
- Cortex packet: n/a.
- Risk: medium.
- Risk basis: user-visible history behavior changes from failing the whole page
  to omitting unsafe record previews.
- Main uncertainty: whether any downstream code expects `record: undefined` to
  be attached for invalid strong refs; local code reads tolerate absence.
- Blast radius: moderation event hydration, subject title fallback, and
  workspace subject-author extraction.
- Parallel-safe with: sequential.
- Verification rung: unit plus type.
- Verification command:
  `npm exec --yes --package=@yarnpkg/cli-dist@4.8.1 yarn -- test:unit`.
- Integration gate: unit tests pass and typecheck covers hook call sites.
- Rollback command:
  `git restore -- lib/util.ts components/mod-event/useModEventList.tsx components/mod-event/helpers/subject.tsx components/mod-event/hydration.ts && rm -f components/mod-event/helpers/subject.test.ts`.
- Definition of Done: malformed or incomplete record-shaped subjects do not
  reach `getRecords`, `getSubjectTitle` does not throw, and events remain
  present.

- [ ] **Step 1: Add the utility guard**:

```ts
import { parseAtUriString } from '@atproto/syntax'

/**
 * Returns true only for AT URIs that identify a concrete repository record.
 */
export function isFullRecordAtUri(uri: string): boolean {
  const result = parseAtUriString(uri)

  if (!result.success) {
    return false
  }

  return Boolean(result.value.collection && result.value.rkey)
}
```

- [ ] **Step 2: Filter record hydration targets** - only add strongRef URIs
  when `isFullRecordAtUri(event.subject.uri)` returns true.
- [ ] **Step 3: Use the extracted helper from `useModEventList.tsx`** - keep
  repo hydration behavior unchanged and attach record details only when a valid
  record URI has hydrated data.
- [ ] **Step 4: Guard secondary parsing** - in the subject-author workspace
  branch and `getSubjectTitle`, parse record URIs only after
  `isFullRecordAtUri`.
- [ ] **Step 5: Add title fallback regression** - malformed strongRef returns
  `Subject` instead of throwing.
- [ ] **Step 6: Run unit tests** -
  `npm exec --yes --package=@yarnpkg/cli-dist@4.8.1 yarn -- test:unit`.

### Task 5: Typecheck and local blast-radius audit

**Files:** No new files expected; fixes remain limited to files named above.

**Execution:**
- Owner: current session (Crown: Executor).
- Support: Beru, Memetar.
- Auditor: Fangs.
- Delegation packet: local.
- Cortex packet: n/a.
- Risk: medium.
- Risk basis: generated lexicon types and path aliases can surface issues only
  under TypeScript.
- Main uncertainty: existing repository type debt.
- Blast radius: compile-time only.
- Parallel-safe with: sequential.
- Verification rung: type plus structural audit.
- Verification command:
  `npm exec --yes --package=@yarnpkg/cli-dist@4.8.1 yarn -- type-check`.
- Integration gate: if typecheck fails, audit and fix failures in touched
  files; do not ignore infrastructure failures.
- Rollback command: use each previous task's rollback command if failure is
  caused by the change and cannot be fixed narrowly.
- Definition of Done: typecheck passes or any unrelated pre-existing failure is
  documented with exact evidence after touched-file failures are cleared.

- [ ] **Step 1: Run all unit tests** -
  `npm exec --yes --package=@yarnpkg/cli-dist@4.8.1 yarn -- test:unit`.
- [ ] **Step 2: Run typecheck** -
  `npm exec --yes --package=@yarnpkg/cli-dist@4.8.1 yarn -- type-check`.
- [ ] **Step 3: Re-run structural searches** -
  `ast-grep run --pattern '$AGENT.tools.ozone.moderation.getRecords($ARGS)' --lang tsx components lib`
  and
  `ast-grep run --pattern 'new AtUri($URI)' --lang tsx components/mod-event lib`.
- [ ] **Step 4: Inspect package diff** -
  `git diff -- package.json yarn.lock vitest.config.ts`.

### Task 6: Archive decisions and commit implementation

**Files:** Create:
`decisions/2026-07-07-issue-472-vitest-and-uri-guard.md` if implementation
matches the ADRs. Modify this spec's Engineering Ledger with verification
evidence.

**Execution:**
- Owner: current session (Crown: Executor).
- Support: Bellion, Igris.
- Auditor: Tank.
- Delegation packet: local.
- Cortex packet: n/a.
- Risk: low.
- Risk basis: documentation and commit hygiene after tests pass.
- Main uncertainty: whether final implementation materially diverged from the
  plan; if it did, update ADRs before committing.
- Blast radius: durable docs and git history.
- Parallel-safe with: sequential.
- Verification rung: repository-state audit.
- Verification command: `git status --short`.
- Integration gate: path-limited staging preserves unrelated user work.
- Rollback command:
  `git restore -- specs/2026-07-07-issue-472-vitest-reproduction-fix.md decisions/2026-07-07-issue-472-vitest-and-uri-guard.md`.
- Definition of Done: implementation and docs are committed with conventional
  messages, and the final ledger includes test evidence.

- [ ] **Step 1: Create decision note** - summarize accepted test-runner and URI
  guard decisions.
- [ ] **Step 2: Close Engineering Ledger** - include unit, typecheck, structural
  audit, and git status evidence.
- [ ] **Step 3: Stage only task-owned paths** -
  `git add package.json yarn.lock vitest.config.ts lib/util.ts lib/util.test.ts components/mod-event/hydration.ts components/mod-event/hydration.test.ts components/mod-event/useModEventList.tsx components/mod-event/helpers/subject.tsx components/mod-event/helpers/subject.test.ts specs/2026-07-07-issue-472-vitest-reproduction-fix.md decisions/2026-07-07-issue-472-vitest-and-uri-guard.md`.
- [ ] **Step 4: Commit** -
  `git commit -m "fix: skip malformed moderation record hydration"`.

## Verification

- `npm exec --yes --package=@yarnpkg/cli-dist@4.8.1 yarn -- test:unit`
- `npm exec --yes --package=@yarnpkg/cli-dist@4.8.1 yarn -- type-check`
- `ast-grep run --pattern '$AGENT.tools.ozone.moderation.getRecords($ARGS)' --lang tsx components lib`
- `ast-grep run --pattern 'new AtUri($URI)' --lang tsx components/mod-event lib`
- `git status --short`

## Rollout

- Feature flag: n/a.
- Progressive stages: single-shot frontend hardening.
- Telemetry gates: n/a - no new runtime telemetry.
- Abort conditions: unit test cannot reproduce the invalid `getRecords` payload,
  typecheck fails in touched code, or dependency installation cannot produce a
  coherent Yarn lockfile.

## Rollback

- Trigger conditions: tests fail after a narrow fix attempt, package install
  corrupts the lockfile, or hydration behavior changes beyond skipping unsafe
  record previews.
- Command: revert the implementation commit after it exists, or use the
  task-local `git restore` commands before commit.
- Data repair: n/a - no persisted data or migration.
- Verification: `npm exec --yes --package=@yarnpkg/cli-dist@4.8.1 yarn --
  test:unit` and `npm exec --yes --package=@yarnpkg/cli-dist@4.8.1 yarn --
  type-check` after rollback.
- Dry-run evidence: Task-local rollback commands are file-scoped and avoid
  unrelated work.

## Engineering Ledger

### 2026-07-07 19:45 - Planning kickoff

**Mode:** Planning.
**Context:** User requested a spec for adding plain Vitest, reproducing issue
#472, and fixing the actual moderation history load-more failure.
**Evidence:** `git status --short --branch` reported
`## fix/issue-472-moderation-history-load-more` with no dirty paths.
**Decision / next step:** Create and commit a Raid-tier direct-rollout spec,
then execute it in the same session.
**ADR impact:** ADR-001 through ADR-004 accepted in plan.

### 2026-07-07 19:50 - Local and external evidence

**Mode:** Planning.
**Context:** Verified local failure path and current test-runner guidance.
**Evidence:** `ast-grep` found one
`tools.ozone.moderation.getRecords({ uris: chunk })` call in
`components/mod-event/useModEventList.tsx`; official Next.js and Vitest docs
were accessed on 2026-07-07.
**Decision / next step:** Use plain Vitest for the payload contract and keep
browser-mode testing out of scope.
**ADR impact:** Supports ADR-001 and ADR-003.

### 2026-07-07 HH:MM - Execution closure

**Mode:** Execution.
**Context:** To be completed after implementation.
**Evidence:** Unit test output, typecheck output, structural audit output, and
commit SHA range will be recorded here.
**Decision / next step:** Close the campaign when every task and verification
gate is complete.
**ADR impact:** None expected.
