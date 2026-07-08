# CI Dependency Audit Policy

Date: 2026-07-07

## Decision

Ozone now runs a recursive Yarn dependency audit in CI for both the root app and
the independently installed `service` package. The job captures full recursive
audit output as artifacts, then blocks the workflow only on high-or-worse
findings.

The repository also pins the current Node and Yarn toolchain for this audit
path:

- Node.js: `26.4.0`
- Yarn: `4.17.0`

## Rationale

The baseline audit showed high-severity vulnerabilities in both lockfiles, so a
new CI check would have been permanently red without dependency remediation.
Those high findings were remediated before the gate was added.

The full recursive report remains valuable even when it includes lower-severity
or deprecation findings. Uploading it as an artifact preserves before/after
analysis data without making every moderate deprecation a merge blocker.

`cypress@15.18.1` and `@atproto/ozone@0.2.13` were not used because Yarn
reported those exact releases as quarantined. The branch uses the newest
non-quarantined versions that clear the high-severity gate:

- `cypress@15.17.0`
- `@atproto/ozone@0.2.12`

## Consequences

- Pull requests now fail when root or service dependencies contain recursive
  high-severity audit findings.
- CI artifacts retain full audit output for later analysis.
- The service package now declares its own Node/Yarn contract and `react-dom`
  peer dependency because it is installed independently during Docker builds.
- Remaining root full-audit findings are tracked as follow-up migration work:
  `rehype-autolink-headings`' `@ungap/structured-clone` deprecation and the
  Recharts v3 migration.
