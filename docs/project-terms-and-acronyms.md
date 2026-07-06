# Project Terms and Acronyms

This glossary captures the main vocabulary used by Ozone's documentation,
source code, configuration, and contributor-facing issue research. It is meant
as a reference for contributors who need to understand Ozone's moderation,
atproto, hosting, and workflow terminology without reverse-engineering it from
multiple files.

Researched on 2026-07-06 from the local repository sources listed in
[Source Map](#source-map).

## Core Product Terms

- **Ozone**: The atproto labeling and moderation system in this repository.
  It provides a web UI, a backend labeling service, and supporting operational
  tooling for moderation teams and independent labelers.
- **Ozone UI**: The Next.js web application used by moderators and admins. It
  talks to an Ozone labeling service through atproto/XRPC APIs.
- **Ozone service / backend**: The service that stores moderation state,
  emits labels, handles team permissions, exposes Ozone APIs, and integrates
  with PDS, AppView, chat, blob-divert, SafeLink, queues, and settings.
- **Labeling service**: A moderation service that publishes labels for
  subjects. Ozone is one implementation of a labeling service.
- **Labeler**: The account or service that creates labels. In the Bluesky app,
  labeler accounts are surfaced differently from ordinary user accounts.
- **Labeler service account**: A dedicated atproto account representing an
  Ozone labeler. Hosting docs recommend using a separate account rather than a
  personal account.
- **Independent moderation service**: A third-party or separately operated
  moderation service. The user guide emphasizes that independent services are
  responsible for their own policies and decisions.
- **Stackable moderation**: Bluesky/atproto's model where multiple labelers can
  publish labels that clients or services may choose to consume.
- **Bluesky Social PBC**: The public benefit corporation that develops Ozone
  and the Bluesky app. The repo docs mention its dual license and patent
  non-aggression pledge.
- **Service metadata**: Ozone metadata served from
  `/.well-known/ozone-metadata.json`, including the service DID, URL, and
  public key.
- **Configuration flow**: The Ozone UI flow that connects a service account's
  DID document and labeler service record to the hosted Ozone instance.

## Atproto and Bluesky Protocol Terms

- **atproto**: The Authenticated Transfer Protocol. Ozone is built on atproto
  and uses atproto identities, repositories, records, labels, and lexicons.
- **Lexicon**: The schema system used by atproto APIs. Ozone uses the
  `tools.ozone.*` namespace, Bluesky app APIs use `app.bsky.*`, lower-level
  protocol APIs use `com.atproto.*`, and chat moderation APIs use
  `chat.bsky.*`.
- **Namespace**: A lexicon prefix such as `tools.ozone`, `app.bsky`,
  `com.atproto`, or `chat.bsky`.
- **NSID**: Namespaced Identifier. A dot-separated atproto identifier such as
  `app.bsky.feed.post`. `lib/util.ts` validates NSIDs as at least three
  segments.
- **XRPC**: The atproto HTTP RPC style. Ozone hosting and source code call XRPC
  endpoints such as `/xrpc/com.atproto.repo.getRecord`.
- **DID**: Decentralized Identifier. Ozone uses DIDs to identify accounts,
  service accounts, labelers, and repository subjects.
- **DID PLC**: A `did:plc:*` identity resolved through the PLC directory.
  Ozone local development uses a local PLC server; production defaults to
  `https://plc.directory`.
- **DID Web**: A `did:web:*` identity resolved from a domain's
  `/.well-known/did.json`.
- **DID document**: Identity document containing aliases, verification methods,
  and service endpoints. Ozone checks it for `atproto_labeler`, `atproto_label`,
  and `atproto_pds` entries.
- **DID key**: A `did:key:*` value derived from a DID document verification
  method. Ozone compares it against service metadata to confirm key matching.
- **Verification method**: DID document entry that publishes the public key
  used for signing or proving service identity.
- **Service endpoint**: DID document entry pointing to a service URL such as an
  Ozone labeler endpoint or PDS endpoint.
- **PDS**: Personal Data Server. Stores user repositories, records, email
  delivery integration, invite codes, and account-level admin functions.
- **AppView**: Application view service that indexes and serves app-level
  content such as Bluesky profiles, posts, feeds, lists, and search results.
- **PLC directory / PLC server**: Service used to resolve `did:plc` identities.
  Local development uses the dev-env PLC server.
- **Handle**: Human-readable atproto account identifier, such as
  `example.bsky.social` or a custom domain handle. Ozone can resolve handles to
  DIDs.
- **AT-URI**: An atproto URI such as
  `at://did:plc:abc/app.bsky.feed.post/xyz`. Ozone uses AT-URIs for record
  subjects.
- **Repo**: An atproto repository for an account. Ozone repository pages show
  account metadata, records, labels, tags, reports, and related account data.
- **Record**: A repository entry in a collection, such as a post, profile, list,
  feed generator, starter pack, profile status, or labeler service record.
- **Collection**: The NSID naming a record type, such as
  `app.bsky.feed.post`, `app.bsky.actor.profile`, or
  `app.bsky.labeler.service`.
- **rkey**: Record key within a collection. Ozone parses and builds AT-URIs
  from DID, collection, and rkey.
- **CID**: Content Identifier. For record subjects, Ozone may include a CID to
  identify the exact version of a record.
- **StrongRef**: `com.atproto.repo.strongRef`, a record reference containing a
  URI and CID. Ozone emits record-subject moderation events with strong refs.
- **RepoRef**: `com.atproto.admin.defs#repoRef`, an account subject reference
  containing a DID.
- **ConvoRef / messageRef**: Chat subject references under `chat.bsky.convo`.
  Ozone supports conversation reports and warns that actioning a conversation
  directly may not have the same effect as actioning members.
- **Blob**: Binary media object in atproto. Ozone has blob-divert permissions
  and can request blob diversion when configured.
- **Label stream**: WebSocket stream exposed by
  `com.atproto.label.subscribeLabels` for consumers of labels published by the
  Ozone service.
- **Labeler service record**: `app.bsky.labeler.service` record published in
  the labeler service account repository so clients can discover labeler
  policies and supported labels.
- **bsky.app URL**: A Bluesky web URL. Ozone can convert between AT-URIs and
  Bluesky app URLs for profiles, posts, lists, feeds, and starter packs.

## Subject and Content Terms

- **Subject**: The moderation target. It may be an account DID, a record
  AT-URI/CID, or a conversation reference.
- **Account subject**: A DID-level subject represented as a repo ref.
- **Record subject**: A content-level subject represented by an AT-URI and, when
  available, a CID.
- **Conversation subject**: A chat conversation subject synthesized as an
  `at://{did}/chat.bsky.convo/{convoId}` identifier in UI helpers and converted
  to a chat convo ref for Ozone calls.
- **Profile record**: `app.bsky.actor.profile/self`. The API docs call out that
  the profile record is a distinct subject from the account itself.
- **Profile status**: `app.bsky.actor.status`, a Bluesky record type surfaced
  by Ozone preview cards.
- **Post**: `app.bsky.feed.post`, the common Bluesky content record.
- **Feed generator**: `app.bsky.feed.generator`, a custom feed record type that
  can be reported and acted on.
- **List**: `app.bsky.graph.list`, a Bluesky list record type.
- **Starter pack**: `app.bsky.graph.starterpack`, a Bluesky starter pack record
  type with its own Bluesky app URL and OG-card preview.
- **Embed**: Media or external content attached to records. Ozone distinguishes
  image, video, external, and no-embed cases.
- **Raw JSON**: Fallback rendering for records Ozone cannot render cleanly.
- **Peek link**: User-guide term for opening the relevant subject in the
  Bluesky app to inspect it in context.
- **Subject status**: Ozone state for a subject, including review state, muted
  state, appeal state, takedown state, labels, tags, and current metadata.

## Label Terms

- **Label**: Moderation annotation applied by a labeler. Labels can be shown in
  Ozone, consumed by clients, and used with media filters.
- **Label value**: The label's `val`, such as `porn`, `nudity`, `sexual`,
  `graphic-media`, or `self-harm`.
- **Label source**: The label's `src`, usually the DID of the labeler that
  created the label.
- **Label value definition**: Labeler policy metadata describing a label value.
- **Self-label**: A label from the current labeler service. Ozone marks these
  internally with a `(self)` suffix while preparing selector values.
- **External labeler**: A labeler other than the current Ozone service. Ozone
  has configuration and issue-triage notes around external labeler display and
  discovery.
- **Label group**: Configurable grouping and display metadata for labels.
  Stored under the `tools.ozone.setting.labelGroups` setting.
- **Graphic media filter**: Display treatment for sensitive labels. Ozone uses
  `blur`, `grayscale`, and `translucent` options.
- **Current service labels**: Labels created by this Ozone instance, distinct
  from labels created by external services.
- **Negated label**: A label removal emitted as part of label changes. Source
  code uses `createLabelVals` and `negateLabelVals` when diffing label edits.

## Moderation Workflow Terms

- **Moderation event / mod event**: An event in Ozone's moderation history.
  Reports, actions, comments, labels, tags, emails, takedowns, and helper
  events are all represented as events.
- **Event log**: Historical timeline of moderation events for a subject or
  account. Ozone can query events with `queryEvents`.
- **Report**: User-created event describing a moderation concern about a
  subject. Reports feed queues and analytics.
- **Appeal**: A self-report or appeal event from a user in response to a
  moderation intervention.
- **Review state**: Ozone state used to decide whether a subject still needs
  moderation review.
- **`reviewOpen`**: Subject requires review.
- **`reviewEscalated`**: Subject has been escalated.
- **`reviewClosed`**: Subject review has been resolved.
- **`reviewNone`**: Subject has no active review state.
- **Report status**: UI/report-level status. Source constants include `open`,
  `escalated`, `closed`, `queued`, and `assigned`.
- **Muted**: Subject status suppressing a subject from default queues unless
  moderators opt to include muted subjects.
- **Appealed**: Subject status indicating there is an appeal.
- **`takendown`**: Ozone's state spelling for a taken-down subject. The spelling
  appears in docs and source and should be preserved when referring to fields.
- **Action panel / Quick Action**: UI used to emit moderation actions, select
  policies, labels, emails, and navigate to the next subject.
- **Ctrl Panel / Ctrl-K**: Quick lookup panel for handles, bsky.app URLs, and
  other subject identifiers.
- **Filter macro**: Saved/importable event-list filter state. Source constants
  use `FILTER_MACROS_LIST_KEY`.
- **Priority score**: Subject priority value used for sorting or emphasizing
  reports. Ozone has a `Set Priority` event.
- **Pinned comment**: Comment surfaced with subject status for moderator context.
- **Tag**: Metadata marker on a subject. Tags drive workflows such as disabled
  DMs, disabled video upload, trusted verifier state, protected tags, and
  language hints.
- **Protected tag**: Tag whose management can be restricted by moderator DID or
  role through `tools.ozone.setting.protectedTags`.
- **Language tag**: A tag like `lang:en`; email template selection can use
  recipient language tags.
- **Queue**: Dynamic list of subjects or reports matching filters and states.
  Ozone has both older client-configured queues and newer server-backed queue
  APIs.
- **Queue config**: Client queue JSON from `NEXT_PUBLIC_QUEUE_CONFIG` or
  `tools.ozone.setting.client.queue.list`.
- **Queue seed**: Initial queue seed string from `NEXT_PUBLIC_QUEUE_SEED` or
  `tools.ozone.setting.client.queue.seed`.
- **Route reports**: Queue API operation that places reports into queues based
  on queue configuration.
- **Pending count**: Queue count of matching reports/subjects awaiting action.
- **Assignment**: Association between a moderator DID and a queue or report.
  Ozone can assign, unassign, poll, and display assignments.
- **Assignee**: Moderator assigned to a queue or report.
- **Viewer**: A temporary report viewer registration used to show who is
  looking at a report without permanently assigning it.
- **Workspace**: Batch working set of subjects selected from searches,
  queues, reports, related accounts, verification views, or lists.
- **Workspace filter**: Structured filter over workspace subjects. Source
  filters include verifier, tag, follower counts, account age, takendown,
  email-confirmed, email text, record creation, embeds, content, review state,
  and age-assurance state.
- **Batch ID**: Workspace/report batch identifier. External intake tools can
  pass a batch ID so related reports stay grouped.
- **Moderator stats / analytics**: Report analytics views backed by live and
  historical Ozone report stats APIs.
- **Action recommendation**: UI helper that evaluates policy, severity,
  historical strikes, expiry, and target services to recommend an enforcement
  outcome.

## Moderation Event Types

- **Acknowledge**: Marks reports as acknowledged.
- **Escalate**: Escalates a subject or report for higher-level review.
- **Label**: Applies or negates labels for a subject.
- **Mute / Unmute**: Changes muted state for a subject.
- **Mute Reporter / Unmute Reporter**: Changes whether reports from a reporter
  should be muted.
- **Takedown**: Removes or suspends access to a subject through configured
  target services.
- **Reverse Takedown**: Reverts a prior takedown.
- **Comment**: Adds moderator context to the event log.
- **Report**: Records a report event.
- **Resolve Appeal**: Resolves an appeal.
- **Email**: Records that an email was sent through Ozone/PDS integration.
- **Tag**: Adds or removes tags.
- **Divert**: Requests blob diversion when blob-divert integration is
  configured.
- **Set Priority**: Updates a subject priority score.
- **Disable DMs / Enable DMs**: Adds or removes the `chat-disabled` tag and
  requests chat-service enforcement when configured.
- **Disable Video Upload / Enable Video Upload**: Adds or removes the
  `video-upload-disabled` tag and requests video-upload enforcement.
- **Make Trusted Verifier / Revoke Trusted Verifier**: Grants or removes trusted
  verifier status.
- **Age Assurance**: Records age-assurance state.
- **Age Assurance Override**: Moderator override to set age assurance to
  `assured`, `reset`, or `blocked`.
- **Age Assurance Purge**: Purges age-assurance data where supported.
- **Revoke Account Credentials**: Revokes account credentials and may use a
  configured communication template.
- **Schedule Takedown**: Schedules a future takedown.
- **Cancel Scheduled Takedown**: Cancels scheduled action(s).
- **Account event**: Generic account-level event.
- **Record event**: Generic record/content-level event.
- **Identity event**: Event related to identity state.
- **InfraTakedown**: User-guide term for infrastructure-level takedown at a
  PDS, Relay, or AppView. It depends on infrastructure respecting the
  moderation service authority.

## Policy and Enforcement Terms

- **Policy**: Configured moderation policy stored as
  `tools.ozone.setting.policyList`. Policy records include name, description,
  optional URL, email copy, and severity-level configuration.
- **Policy key**: Normalized key derived from a policy name for lookups.
- **Severity level**: Configured enforcement severity stored as
  `tools.ozone.setting.severityLevels`. A severity can define strikes,
  takedown requirement, expiry, and email summaries.
- **Strike**: Enforcement count used by the action recommendation logic and
  suspension duration mapping.
- **Strike count**: Number of strikes applied by a severity level.
- **Strike-on-occurrence**: Severity configuration that applies strikes only on
  a given repeated occurrence threshold.
- **First occurrence strike count**: Alternate strike count for first-time
  occurrences.
- **Expiry**: Duration after which a strike or severity occurrence may stop
  contributing to recommendations.
- **Needs takedown**: Severity flag indicating that the action should lead to
  takedown regardless of ordinary strike thresholds.
- **Target service**: Enforcement destination. Source types currently include
  `appview` and `pds`.
- **Suspension duration mapping**: Mapping from strike threshold to suspension
  duration in hours, configured by `NEXT_PUBLIC_STRIKE_SUSPENSION_CONFIG`.
- **Permanent suspension**: Represented in the suspension mapping by
  `Infinity`.
- **Automated action email**: Email template configured for automated action
  flows, such as strike emails through `NEXT_PUBLIC_STRIKE_EMAIL_TEMPLATE_ID`.
- **Scheduled action**: Future enforcement action listed and cancellable in the
  scheduled actions UI.

## Report Reason Taxonomy

- **Legacy reasons**: `Spam`, `Violation of Terms`, `Misleading`, `Sexual`,
  `Rude or Harassment`, `Other`, and `Appeal` from
  `com.atproto.moderation.defs`.
- **Appeal**: `tools.ozone.report.defs#reasonAppeal`.
- **Violence and Welfare**: Animal Violence, Animal Welfare Violation, Violent
  Threats, Graphic Violent Content, Self-Harm Content, Violence Glorification,
  Extremist Content, Human Trafficking, and Other Violence.
- **Sexual Content**: Sexual Abuse Content, NCII, Sextortion, Sexual Deepfake,
  Sexual Content Involving Animals, Unlabeled Sexual Content, and Other Sexual
  Content.
- **Child Safety**: CSAM, Child Grooming, Child Privacy Violation, Minor
  Privacy Violation, Child Endangerment, Child Harassment, Promotion of Child
  Abuse, and Other Child Safety Issue.
- **Harassment**: Trolling, Targeted Harassment, Hate Speech, Doxxing, and
  Other Harassment.
- **Misleading**: Bot Account, Impersonation, Spam, Scam, Election
  Interference, Synthetic Content, Misinformation, and Other Misleading
  Content.
- **Rule Violations**: Site Security Violation, Stolen Content, Prohibited
  Sales, Ban Evasion, and Other Rule Violation.
- **Civic Issues**: Electoral Process Interference, Missing Civic Disclosure,
  Civic Interference, Civic Misinformation, and Civic Impersonation.
- **Self Harm**: Self Harm Content, Eating Disorder Content, Self Harm Stunts,
  Self Harm Substances, and Other Self Harm Content.
- **Other**: Catch-all Ozone reason.
- **Report tag**: Source helper `getTagForReport()` converts a reason to a tag
  like `report:sexual-ncii`.
- **Stats category**: Report analytics category. The frontend source notes that
  report stat reason groups must match the backend Ozone report stats code.

## Roles, Teams, and Permissions

- **Team member**: Ozone account granted a role in the Ozone service.
- **Admin**: Highest role. Can manage team, policies, queues, settings, sets,
  moderator stats, and admin-only actions.
- **Moderator**: Role allowed to take moderation actions such as labels,
  takedowns, emails, chat management, queues, and templates when corresponding
  services are configured.
- **Triage**: Lower-privilege moderation role. API docs mention that triage
  users cannot perform all moderator/admin actions.
- **Verifier**: Role used for verification workflows.
- **Role hierarchy**: Source helper treats Admin as superior to all roles,
  Moderator as superior to Moderator and Triage, Triage as peer-only, and
  Verifier as verifier-only.
- **Permission name**: Fine-grained capability derived from server config and
  role. Current source permissions include:
  - `canManageTemplates`
  - `canTakedown`
  - `canLabel`
  - `canManageChat`
  - `canSendEmail`
  - `canManageTeam`
  - `canTakedownFeedGenerators`
  - `canDivertBlob`
  - `canManageSets`
  - `canVerify`
  - `canManageQueues`
  - `canAssignOthers`
  - `canPurgeAgeAssurance`
  - `canViewModeratorStats`
- **Server config**: Ozone backend config exposed to the UI. Includes PDS,
  AppView, blob-divert, chat, viewer role, verifier DID, and permissions.
- **Admin token / admin password**: Backend admin credential configured through
  `OZONE_ADMIN_PASSWORD`; hosting docs describe it as usable as an API key for
  certain actions.

## Safety, Integrity, and Account Tools

- **SafeLink**: Ozone tool for URL/domain safety rules. It can block, warn, or
  whitelist URL/domain patterns.
- **SafeLink rule**: Rule containing pattern, action, reason, and metadata.
- **SafeLink action**: `block`, `warn`, or `whitelist`.
- **SafeLink pattern type**: `domain` or `url`.
- **SafeLink reason**: `csam`, `spam`, `phishing`, or `none`.
- **SafeLink event**: `addRule`, `updateRule`, or `removeRule`.
- **Age assurance**: Workflow for tracking or moderating an account's
  age-assurance status.
- **Age assurance state**: `unknown`, `pending`, `assured`, `reset`, or
  `blocked`.
- **Age assurance access state**: `unknown`, `none`, `safe`, or `full`.
- **Trusted verifier**: Account marked with the trusted verifier tag or
  verification state. Ozone can grant or revoke verifier status.
- **Verified user**: User with valid verification metadata.
- **Invalid verification / invalid verifier**: Verification UI states for
  mismatched or no-longer-valid verification data.
- **Revoke account credentials**: Action that invalidates account credentials
  and can optionally send a configured email template.
- **DM disable tag**: `chat-disabled`. Used to represent disabled DMs.
- **Video upload disable tag**: `video-upload-disabled`. Used to represent
  disabled video upload capability.
- **Blob divert**: Configured service integration and permission for diverting
  blobs.
- **Invite tree / invite codes**: Account-management tools that require PDS
  privileged access.
- **Related accounts**: Signature-based search results showing accounts with
  matching account properties.
- **Signature search**: Repository search prefix `sig:`. Ozone can search
  accounts by one signature or a JSON array of signature values.
- **Correlation**: Workspace tool that finds shared signature values across
  selected subjects.
- **Sets**: Ozone-managed named value sets exposed by `tools.ozone.set.*`.
  Admins can create, update, view, and delete sets and set values.

## External Intake and Moderation Tooling

- **modTool**: Metadata on a report indicating the external intake tool that
  created or supplied context for the report.
- **External intake tool**: A non-Ozone tool that sends reports or context into
  Ozone. Source comments mention fieldkit's TIDA/NCII intake form as an
  example.
- **Mod tool registry**: JSON config keyed by `modTool.name`, parsed from
  `NEXT_PUBLIC_MOD_TOOL_REGISTRY`. It maps tool metadata fields into curated UI
  displays and admin links.
- **Mod tool field**: Registry field configuration for displaying or linking a
  value from `modTool.meta`.
- **Admin URL template**: Registry template for building deep links into an
  external tool from report metadata.
- **Context panel**: UI surface that renders curated external-tool metadata
  instead of showing only raw JSON.

## Communication and Email Terms

- **Email tab / composer**: UI for sending account email through the PDS. It
  may use a template or free-form text.
- **Communication template / email template**: Backend-stored template for
  email content. Templates have name, subject, Markdown content, optional
  language, and disabled state.
- **Template variable**: Double-brace placeholder such as `{{handle}}`.
- **Template comment placeholder**: Triple-hash placeholder such as
  `### DESCRIPTION OF IMAGE ###`; docs say mail is blocked until replaced or
  an override is toggled.
- **Action communication template**: Mapping from specific action names to
  template IDs, stored under `tools.ozone.setting.action.communicationTemplates`.
- **Recipient language**: Language tags on a repo used to preselect matching
  communication templates.
- **Email recipient status**: PDS-dependent status determining whether Ozone
  can send an email to an account.
- **PDS email delivery**: Email delivery path where Ozone requests the account
  PDS to send the email because the PDS knows the private email address.
- **Automated strike email**: Email selected by action recommendation/takedown
  flows when strike template IDs are configured.

## Hosting and Runtime Terms

- **Self-hosting**: Operating an independent Ozone instance.
- **Docker**: Container runtime used by the production hosting recipe.
- **Docker Compose**: Multi-service container orchestration used by hosting
  docs and compose files.
- **Caddy**: Reverse proxy in the hosting setup. It handles HTTPS/TLS and
  WebSocket forwarding.
- **Postgres**: Database used by the Ozone service.
- **Watchtower**: Container update tool included in the hosting setup.
- **systemd**: Linux service manager used in the hosting docs for service
  startup.
- **Ozone daemon**: Service container/process included in the Docker compose
  setup alongside the web/backend process.
- **TLS**: Transport Layer Security. Caddy configures TLS certificates for
  HTTPS in the documented hosting path.
- **DNS**: Domain Name System. Hosting docs require A/AAAA records for the
  Ozone hostname.
- **TTL**: DNS Time To Live. Hosting docs suggest 600 seconds as a reasonable
  value.
- **HTTP / HTTPS**: Web protocols used for Ozone service and AppView/PDS
  endpoints.
- **WebSocket / WSS**: Streaming protocol used by the label stream.
- **PostgreSQL URL**: Database connection string configured by
  `OZONE_DB_POSTGRES_URL`.
- **Migration**: Database schema migration at startup when `OZONE_DB_MIGRATE=1`.
- **JSON logs**: Log output controlled by `LOG_ENABLED`.
- **Let's Encrypt**: Certificate authority used by Caddy for TLS certificates.

## Local Development and Tooling Terms

- **dev-env**: Local atproto development environment. It runs local PLC, PDS,
  AppView, Ozone service, and seeded users.
- **Sibling atproto checkout**: Local `atproto` repository used for dev-env and
  package linking.
- **Seeded credentials**: Local development accounts such as `mod.test`,
  `triage.test`, and `admin-mod.test`.
- **Yarn**: Package manager configured by `packageManager: yarn@4.8.1`.
- **Corepack**: Node package-manager shim used to enable the repository's Yarn
  version.
- **pnpm**: Package manager needed by atproto dev-env according to local
  development docs.
- **Node**: JavaScript runtime. The repo targets Node 20.x and Volta pins
  Node 20.9.0.
- **Volta**: Node/toolchain version manager configured in `package.json`.
- **Next.js**: React application framework used by the Ozone UI.
- **React**: UI library used by Ozone.
- **TypeScript**: Typed JavaScript language used by the UI.
- **Tailwind CSS**: Utility CSS framework used by UI components.
- **React Query**: Data-fetching/cache library from `@tanstack/react-query`.
- **Headless UI / Heroicons**: UI primitives and icons used throughout the app.
- **kbar**: Command palette library used by the Ctrl-K command surface.
- **hls.js**: HLS video playback library.
- **Cypress**: Browser testing framework. Scripts include Cypress open and E2E
  run commands.
- **E2E test**: End-to-end test run through Cypress.
- **Component test**: Cypress component testing mode configured in
  `cypress.config.ts`.
- **SSR**: Server-side rendering. Source comments note some client-only code is
  loaded carefully to avoid SSR issues.
- **link-atproto / unlink-atproto**: Scripts that link or unlink a local
  atproto checkout through `ATPROTO_PATH`.

## Configuration and Environment Variables

- **`OZONE_SERVER_DID`**: DID of the Ozone service account.
- **`OZONE_PUBLIC_URL`**: Public HTTPS URL of the Ozone service.
- **`OZONE_ADMIN_DIDS`**: Comma-separated DIDs allowed to log in as admins.
- **`OZONE_ADMIN_PASSWORD`**: Admin password/API key for privileged backend
  actions.
- **`OZONE_SIGNING_KEY_HEX`**: Hex-encoded private key used mainly to sign
  labels.
- **`OZONE_DB_POSTGRES_URL`**: Postgres connection URL.
- **`OZONE_DB_MIGRATE`**: Startup migration flag.
- **`OZONE_DID_PLC_URL`**: PLC directory URL for identity lookups.
- **`OZONE_APPVIEW_URL`**: AppView endpoint URL.
- **`OZONE_APPVIEW_DID`**: DID of the AppView service.
- **`LOG_ENABLED`**: Enables or disables JSON log output.
- **`NEXT_PUBLIC_OZONE_SERVICE_DID`**: Browser-visible Ozone service DID.
- **`NEXT_PUBLIC_OZONE_PUBLIC_URL`**: Browser-visible public Ozone URL.
- **`NEXT_PUBLIC_PLC_DIRECTORY_URL`**: Browser-visible PLC directory URL.
- **`NEXT_PUBLIC_QUEUE_CONFIG`**: Browser-visible queue config JSON.
- **`NEXT_PUBLIC_QUEUE_SEED`**: Browser-visible queue seed.
- **`NEXT_PUBLIC_SOCIAL_APP_URL`**: Bluesky/social app URL used for links.
- **`NEXT_PUBLIC_HANDLE_RESOLVER_URL`**: Handle resolution service URL.
- **`NEXT_PUBLIC_NEW_ACCOUNT_MARKER_THRESHOLD_IN_DAYS`**: Threshold for marking
  new accounts.
- **`NEXT_PUBLIC_YOUNG_ACCOUNT_MARKER_THRESHOLD_IN_DAYS`**: Threshold for
  marking young accounts.
- **`NEXT_PUBLIC_DOMAINS_ALLOWING_EMAIL_COMMUNICATION`**: Domains whose PDS
  email integration is allowed.
- **`NEXT_PUBLIC_HIGH_PROFILE_FOLLOWER_THRESHOLD`**: Follower threshold for
  high-profile account warnings.
- **`NEXT_PUBLIC_FALLBACK_VIDEO_URL`**: Fallback video URL config.
- **`NEXT_PUBLIC_STRIKE_SUSPENSION_CONFIG`**: Strike threshold to suspension
  duration mapping.
- **`NEXT_PUBLIC_STRIKE_EMAIL_TEMPLATE_ID`**: Template ID for strike emails.
- **`NEXT_PUBLIC_MOD_TOOL_REGISTRY`**: External intake/mod tool registry JSON.
- **`ATPROTO_PATH`**: Path to a sibling atproto checkout for package linking.
- **`QUEUE_CONFIG` / `QUEUE_SEED`**: Source constants wrapping the public queue
  env vars.
- **`SOCIAL_APP_URL` / `HANDLE_RESOLVER_URL`**: Source constants wrapping
  public social app and handle resolver env vars.
- **`MOD_TOOL_REGISTRY`**: Parsed source constant for external intake registry
  config.
- **`AUTOMATED_ACTION_EMAIL_IDS`**: Source constant grouping configured
  automated email template IDs.

## Acronyms

- **AA**: WCAG contrast conformance level discussed in issue triage research.
- **AAA**: Higher WCAG contrast conformance level discussed in issue triage
  research.
- **ACL**: Access Control List. Appears in issue triage around permission
  enforcement.
- **API**: Application Programming Interface.
- **AT-URI**: Authenticated Transfer URI, the `at://` URI form for atproto
  repository subjects.
- **BCP 47**: Language tag standard used indirectly by language matching
  utilities and template language handling.
- **CID**: Content Identifier.
- **CSAM**: Child Sexual Abuse Material.
- **DM / DMs**: Direct Message / Direct Messages.
- **DNS**: Domain Name System.
- **DPoP**: Demonstrating Proof of Possession. Ozone OAuth metadata requests
  DPoP-bound access tokens.
- **E2E**: End-to-end, usually Cypress browser testing.
- **GDPR**: General Data Protection Regulation. Mentioned in privacy-related
  issue triage notes.
- **HLS**: HTTP Live Streaming, supported through `hls.js`.
- **HTTP**: Hypertext Transfer Protocol.
- **HTTPS**: HTTP over TLS.
- **ID**: Identifier.
- **IP**: Internet Protocol address. Some workspace export fields are
  admin-only, including `ip`.
- **JSON**: JavaScript Object Notation.
- **MIT**: Massachusetts Institute of Technology license, one half of the
  repository's dual license.
- **NCII**: Non-Consensual Intimate Images.
- **NSID**: Namespaced Identifier.
- **OAuth**: Open Authorization. Ozone exposes OAuth client metadata and uses
  atproto OAuth browser clients.
- **OG**: Open Graph. Used in starter-pack OG-card preview URL config.
- **PBC**: Public Benefit Corporation.
- **PDS**: Personal Data Server.
- **PII**: Personally Identifiable Information. Mentioned in privacy issue
  triage and relevant to email/search/export surfaces.
- **PLC**: The DID method and directory behind `did:plc` identities.
- **PR**: Pull Request.
- **RPC**: Remote Procedure Call, as in XRPC.
- **SSR**: Server-side Rendering.
- **TIDA**: External intake tool name referenced in comments for fieldkit's
  TIDA/NCII form.
- **TLS**: Transport Layer Security.
- **TTL**: Time To Live, used by DNS records.
- **UI**: User Interface.
- **URL**: Uniform Resource Locator.
- **WCAG**: Web Content Accessibility Guidelines.
- **WebSocket / WSS**: WebSocket protocol and secure WebSocket scheme.
- **XRPC**: atproto's HTTP RPC API style.

## Source Map

- `README.md`: Product overview, contribution expectations, licensing,
  security contact, PR terminology.
- `docs/api.md`: Ozone concepts, atproto namespace usage, subjects, events,
  reports, queues, subject state, and role-gated APIs.
- `docs/userguide.md`: Moderator UI concepts, action descriptions, account
  view, email templates, privileged PDS features, and queue filters.
- `HOSTING.md`: Self-hosting, service account setup, DNS/TLS, Caddy,
  Docker Compose, Postgres, WebSocket label stream, and production env vars.
- `HACKING.md` and `docs/local-development.md`: Local dev-env setup, sibling
  atproto checkout, ports, local service DIDs, package manager requirements,
  and seeded credentials.
- `lib/constants.ts`: Browser config constants, Ozone DID/public URL, queue
  config, social app links, tags, strike suspension config, and mod tool
  registry.
- `lib/client-config.ts` and `lib/identity.ts`: DID document resolution,
  service metadata, labeler service record lookup, and identity matching.
- `lib/util.ts`: AT-URI parsing/building, bsky.app URL mapping, handle/DID
  validation, NSID validation, and batching helpers.
- `lib/types.ts`: Repo/subject types, valid subject string conversion, convo
  refs, invite codes, and target services.
- `components/mod-event/constants.ts`: Moderation event constants, titles,
  filter macro key, and age-assurance states.
- `components/reports/helpers/getType.ts`: Legacy and Ozone report reason
  taxonomies, stat categories, and report tag generation.
- `components/reports/constants.ts` and `components/reports/stats/index.ts`:
  Report statuses and analytics categories.
- `components/team/helpers.ts` and `lib/server-config.ts`: Team roles,
  role hierarchy, viewer config, and permission names.
- `components/safelink/helpers.ts`: SafeLink action, pattern, reason, event,
  and search-analysis terminology.
- `components/common/labels/util.ts`: Label source/value helpers, self-labels,
  label groups, and graphic media filters.
- `components/setting/policy/types.ts` and
  `components/setting/severity-level/types.ts`: Policy, severity, strike, and
  target-service configuration terms.
- `components/workspace/types.ts`, `components/workspace/*`, and
  `components/signature/RelatedAccounts.tsx`: Workspace filters, related
  accounts, signature searches, correlations, and batch working sets.
- `components/assignments/*`: Queue/report assignments and assignee handling.
- `components/reports/modToolRegistry.ts`: External intake/mod tool registry,
  curated metadata, field config, and admin URL templates.
- `components/communication-template/*` and `components/email/*`:
  Communication templates, email composer behavior, template variables,
  recipient language handling, and action-template mapping.
- `components/sets/*`: Ozone set management and set values.
- `components/scheduled-actions/*`: Scheduled action listing and cancellation.
- `package.json`, `service/package.json`, `service/compose.yaml`,
  `service/Dockerfile`, `next.config.js`, and `cypress.config.ts`: Framework,
  runtime, package manager, testing, Docker, and service-stack terminology.
- `docs/github-issue-triage-2026-07-06.md`: Contributor-facing issue research
  vocabulary such as ACL, PII, WCAG AA/AAA, GDPR, and beginner issue context.
