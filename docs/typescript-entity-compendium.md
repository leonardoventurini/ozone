# TypeScript Entity Compendium

Researched on 2026-07-07 from local TypeScript sources. This compendium is
meant for contributors who are starting in the Ozone UI codebase and need a
map of the named types, domain entities, and protocol-generated type families
they will meet first.

## Scope And Method

- Scanned every repository `*.ts` and `*.tsx` file outside `node_modules`.
- Counted named local `type`, `interface`, `enum`, and `class` declarations
  with the TypeScript parser, then spot-checked declaration kinds with
  `ast-grep`.
- Scanned imports from `@atproto/*` and lexicon namespace string usage to map
  generated atproto entity families.
- Local inventory size at the time of writing:
  - 408 TypeScript or TSX files.
  - 210 named local declarations.
  - 159 `type` aliases.
  - 36 `interface` declarations.
  - 14 `enum` declarations.
  - 1 `class` declaration.
  - 114 exported declarations and 96 local implementation declarations.

In this document, "entity type" means a named TypeScript declaration in this
repository or a generated atproto lexicon type family that acts as a domain
contract. Inline object types and inferred React component props are not listed
unless they have a local name.

## First Mental Model

- Protocol shapes come from `@atproto/api`; local types mostly adapt those
  generated lexicon contracts for UI state, forms, filters, and query params.
- The most important runtime clients are `pdsAgent`, `labelerAgent`, and
  `appviewAgent`. Their types all center on `Agent` from `@atproto/api`.
- Moderation subjects are the main cross-cutting domain shape. They can be an
  account repo ref, a record strong ref, or a chat conversation/message ref.
- Ozone UI stores configuration in two layers:
  - `OzoneConfig` is the public labeler identity and service metadata.
  - `ServerConfig` is the authenticated server capability and permission map.
- Queue, report, moderation-event, settings, SafeLink, team, verification, and
  communication-template screens each add a small local type layer around the
  generated `ToolsOzone*` types.
- The codebase has no local class-based domain model. The only local class is a
  React error boundary for verification UI.

## Generated Atproto Type Families

These are not declared in this repository, but they are the most important
types to recognize. They are generated from atproto lexicons and imported from
`@atproto/api`, `@atproto/oauth-client-browser`, `@atproto/oauth-types`, and
`@atproto/xrpc`.

### Ozone API Families

- `ToolsOzoneModerationDefs` - core moderation views: repos, records,
  moderation events, subject statuses, labels, tags, and action payload data.
- `ToolsOzoneModerationEmitEvent` - input contract and errors for emitting
  moderation events.
- `ToolsOzoneModerationQueryEvents` and `ToolsOzoneModerationQueryStatuses` -
  query contracts for event timelines and moderation queues.
- `ToolsOzoneModerationScheduleAction` and
  `ToolsOzoneModerationListScheduledActions` - scheduled takedown/action
  contracts.
- `ToolsOzoneReportDefs` - report, activity, assignment, live-stat, and
  historical-stat shapes.
- `ToolsOzoneQueueDefs` plus `ToolsOzoneQueueCreateQueue`,
  `ToolsOzoneQueueUpdateQueue`, `ToolsOzoneQueueDeleteQueue`,
  `ToolsOzoneQueueAssignModerator`, `ToolsOzoneQueueUnassignModerator`,
  `ToolsOzoneQueueGetAssignments`, and `ToolsOzoneQueueRouteReports` - queue
  and queue-assignment contracts.
- `ToolsOzoneServerGetConfig` - authenticated server configuration returned to
  the UI and reduced into `ServerConfig`.
- `ToolsOzoneTeamDefs` and `ToolsOzoneTeamListMembers` - team roles and member
  views.
- `ToolsOzoneCommunicationDefs` - communication template views used by email
  tooling.
- `ToolsOzoneSafelinkDefs` - SafeLink rules, actions, patterns, reasons, and
  event types.
- `ToolsOzoneSetDefs` - configured set and set-value contracts.
- `ToolsOzoneSignatureFindRelatedAccounts` - related-account and signature
  search contracts.
- `ToolsOzoneVerificationDefs` and
  `ToolsOzoneVerificationGrantVerifications` - verification list and mutation
  contracts.

### atproto, Bluesky, And Chat Families

- `ComAtprotoAdminDefs` - account repo refs, repo search, invite-code/admin
  operations, and admin subject helpers.
- `ComAtprotoRepoStrongRef` and `ComAtprotoRepoDefs` - record subject refs and
  repository record data.
- `ComAtprotoModerationDefs` - generic atproto report reasons used next to
  Ozone-specific report reasons.
- `ComAtprotoLabelDefs` - label views and label value definitions.
- `ComAtprotoServerCreateSession`, `ComAtprotoServerDefs`,
  `AtpSessionData`, and `CredentialSession` - credential login and PDS
  session data.
- `AppBskyActorDefs`, `AppBskyActorProfile`, `AppBskyActorStatus`,
  `AppBskyActorSearchActors` - profile, actor, and actor-search shapes.
- `AppBskyFeedDefs`, `AppBskyFeedPost`, `AppBskyFeedGetAuthorFeed`,
  `AppBskyFeedSearchPosts`, `GetPostThread`, and `Post` - post, feed, thread,
  and search shapes.
- `AppBskyGraphDefs` - list, follows, followers, starter-pack, and graph data.
- `AppBskyLabelerDefs` and `AppBskyLabelerService` - labeler service metadata
  and service record data.
- `AppBskyEmbedImages`, `AppBskyEmbedVideo`, `AppBskyEmbedExternal`,
  `AppBskyEmbedRecord`, `AppBskyEmbedRecordWithMedia`, and
  `AppBskyEmbedGallery` - embed rendering contracts.
- `ChatBskyConvoDefs`, `ChatBskyActorDefs`, `ChatBskyModerationDefs`, and
  `ChatBskyModerationGetActorMetadata` - conversation and message moderation
  context.
- `Agent`, `AtpAgent`, `AtUri`, `RichTextProcessor`, `asPredicate`, `isDid`,
  `$Typed`, and `LABELS` - client, parsing, validation, and utility types.
- `OAuthSession`, `BrowserOAuthClient`,
  `BrowserOAuthClientLoadOptions`, `AuthorizeOptions`,
  `oauthClientMetadataSchema`, `XRPCError`, and `ResponseType` - OAuth and
  XRPC infrastructure.

## Local Entity Families

### Configuration And Identity

- `DidDocData` (`lib/identity.ts`) is the normalized DID document shape used by
  client-side labeler configuration.
- `OzoneConfig` and `OzoneConfigFull` (`lib/client-config.ts`) represent public
  labeler identity, service metadata, labeler service record state, and setup
  requirements.
- `ServerConfig` and `PermissionName` (`lib/server-config.ts`) turn
  `tools.ozone.server.getConfig` into UI-ready service URLs and boolean
  permissions.
- `ProcessEnv` (`environment.d.ts`) documents the environment variables that
  configure public service discovery and snapshot proxying.

Start here when diagnosing startup, setup flow, missing permissions, missing
PDS/AppView/Chat integration, or "loading forever" states.

### Auth, Agents, And Shell Context

- `AuthContext`, `AuthProviderProps`, and `Profile`
  (`components/shell/AuthContext.tsx`) own the authenticated PDS agent and
  sign-out contract.
- `OAuthSignIn`, `OnRestored`, `OnSignedIn`, `OnSignedOut`, and
  `UseOAuthOptions` (`components/shell/auth/oauth/useOAuth.ts`) define the
  browser OAuth integration hooks.
- `CredentialSignIn` and local `Session`
  (`components/shell/auth/credential/*`) define credential-based fallback
  login.
- `ConfigContextData`, `ConfigurationState`, `ConfigurationContextData`,
  `ConfigurationFlowProps`, `ExternalLabelers`, and `ExternalLabelersData`
  define the setup/configuration provider stack.
- `SidebarNavItem` and `SidebarNavChild` define shell navigation items and
  their command-palette links.

Start here when changing sign-in, account switching, labeler proxying, external
labelers, or global shell layout behavior.

### Subjects, Repos, Records, And Content

- `Repo`, `SubjectStatus`, `InviteCode`, `PropsOf`, and
  `TakedownTargetService` (`lib/types.ts`) are small shared aliases around
  generated protocol types.
- `CollectionId` (`components/reports/helpers/subject.ts`) is the canonical
  local enum for subject collections the UI knows how to name.
- `ActorProfile` and `ProfileLookupAgent` (`lib/profile.ts`) are the reusable
  profile lookup contracts.
- `RecordSnapshot` and `SnapshotResponse` (`lib/useRecordSnapshots.ts`) model
  the Next route handler backed snapshot service.
- `RecordFallback`, `MatchIndicatorProps`, repository search result types, and
  account-view local enums live under `components/repositories`.
- `KnownEmbedView`, `PostControl`, `TypeFilterKey`, and related common post
  types live under `components/common/posts`.

Start here when working with AT-URIs, record previews, profile hydration,
repository pages, snapshot rendering, or subject-to-action conversion.

### Moderation Events And Actions

- `ActionPanelNames` (`components/mod-event/helpers/emitEvent.tsx`) tags the UI
  surface that emitted an action.
- `FilterMacro` (`components/mod-event/helpers/macros.ts`) models saved event
  filter presets.
- `ActionRecommendation` (`components/mod-event/helpers/useActionRecommendation.tsx`)
  models strike/severity-based action advice.
- `WorkspaceConfirmationOptions`, `ModEventListQueryOptions`,
  `ModEventViewWithDetails`, and `EventListState`
  (`components/mod-event/useModEventList.tsx`) are the primary event-list local
  contracts.
- Local private reducer payloads such as `EventListFilterPayload` and
  `EventListAction` describe the event filter reducer.

Start here when changing event lists, event filters, action emission,
scheduled actions, quick actions, or workspace bulk actions.

### Reports, Queues, Assignments, And Analytics

- `ReportStatuses` (`components/reports/constants.ts`) is the local status enum
  for open, escalated, closed, queued, and assigned reports.
- `ReportActionType`, `ReportFormValues`, `ActionErrorKey`, and local action
  form types power report detail actions.
- `ModToolFieldConfig`, `ModToolConfig`, `ModToolRegistry`, and
  `ModToolBadgeColor` (`components/reports/modToolRegistry.ts`) model external
  intake-tool report metadata.
- `QueueListFilters` (`components/queues/useQueues.ts`) is the local query
  filter for server-backed queues.
- Assignment components use generated `ToolsOzoneQueueDefs.AssignmentView` and
  `ToolsOzoneReportDefs.AssignmentView`, with local prop interfaces for their
  UI surfaces.
- `StatGroup`, `ReportStats`, `StatsValuePreset`, `Grouping`,
  `StatsFilterState`, `LiveStatsParams`, and `HistoricalStatsParams`
  (`components/reports/stats/*`) model report analytics.

Start here when changing report queues, report detail pages, assignment
polling, queue configuration, analytics, or external intake metadata.

### Workspace And Bulk Review

- `DurationUnit`, `WorkspaceFilterItem`, `FilterOperator`, and `FilterGroup`
  (`components/workspace/types.ts`) are the central workspace filter grammar.
- `WorkspaceListData` maps subject IDs to hydrated repo/record data for review
  lists.
- `GroupedSubjects` groups account, post, profile, list, and other subject
  identifiers before batch operations.
- Local `FilterContextType`, `ExportableObject`, `WorkspaceItemCreatorProps`,
  and `WorkspaceListProps` bind the workspace UI around that grammar.

Start here when modifying workspace filtering, CSV/export behavior, batch
action panels, or bulk subject hydration.

### Settings, Policies, Labels, And Local Preferences

- `SeverityLevelConfig`, `PolicyDetail`, and `PolicyListSetting`
  (`components/setting/policy/types.ts`) model policy configuration.
- `SeverityLevelDetail` and `SeverityLevelListSetting`
  (`components/setting/severity-level/types.ts`) model severity-level settings.
- `ProtectedTagConfig` and `ProtectedTagSetting`
  (`components/setting/protected-tag/types.ts`) model restricted tag
  configuration.
- `LabelGroup`, `LabelGroupsSetting`, and `GraphicMediaFilterPreference`
  (`components/config/*`) model label-group display and local visual
  preferences.
- `ExtendedLabelerServiceDef` and `GraphicMediaFilter`
  (`components/common/labels/util.ts`) adapt generated labeler service
  definitions for UI use.

Start here when changing configuration tabs, policy/severity editor behavior,
label display, protected tags, or client preference persistence.

### Communication Templates And Email

- `EmailComposerData` (`components/email/helpers.ts`) is the payload emitted by
  the email composer into moderation events.
- Local `RecipientLanguages`, `ComposerActionType`, `ComposerAction`, and
  `ComposerState` support email composition UI state.
- `ActionCommunicationTemplatesValue`
  (`components/communication-template/action-template.tsx`) maps moderation
  actions to configured communication template IDs.
- Quick-action email helpers use `CompileTemplateInput`
  (`app/actions/ModActionPanel/useTakedownEmail.tsx`) for automated takedown
  email rendering.

Start here when changing email templates, automated emails, communication
template routing, or action-to-template mapping.

### SafeLink, Verification, Team, And Scheduled Work

- `SafelinkView`, `SearchQueryAnalysis`, and `SafelinkQueryParams` model the
  SafeLink configuration/search UI around generated SafeLink rule types.
- `VerificationFilterOptions`, `VerificationFilterPanelProps`, and
  `FilterFormState` model verification filtering; `VerificationErrorBoundary`
  is the only local class.
- `OnlineModerator`, `RolePickerProps`, and generated `ToolsOzoneTeamDefs`
  model team/member status.
- Scheduled-action components use local prop interfaces around generated
  scheduled-action views and query responses.

Start here when changing SafeLink rules, verification grants/revokes, team
management, online-moderator indicators, or scheduled-action tables.

### Shared UI And Test Infrastructure

- `Variation`, `Hint`, `DataFieldProps`, `DateRangePreset`,
  `DateRangeValue`, `DropdownItem`, `PaginatedSelectOption`, `TabView`,
  `TabsPanelProps`, `TooltipProps`, and `ColorScheme` are shared UI contracts.
- Cypress extends `Chainable` in `cypress/support/*` and has local fixture
  helper types in component tests.

Start here when adjusting shared controls, date filters, cards, tabs, tooltips,
or test harness behavior.

## Reading Order For New Work

1. Read `docs/project-terms-and-acronyms.md` for product vocabulary.
2. Read `docs/architecture.md` for runtime boundaries.
3. Read `lib/types.ts`, `lib/client-config.ts`, and `lib/server-config.ts` for
   shared aliases and configuration contracts.
4. Read `components/shell/AuthContext.tsx`,
   `components/shell/ConfigContext.tsx`, and
   `components/shell/ConfigurationContext.tsx` for provider flow and agents.
5. Read `components/reports/helpers/subject.ts` before touching subject
   parsing, AT-URIs, or record/account/conversation actions.
6. Read the domain folder for the feature you are changing, then consult the
   complete declaration inventory below for adjacent local types.

## Complete Local Declaration Inventory

This list includes every named local `type`, `interface`, `enum`, and `class`
declaration found by the TypeScript parser. "Exported" means the declaration
is directly exported from its file; "local" means it is an implementation
detail or ambient declaration.

### .

- `ProcessEnv` (interface, local) - `environment.d.ts:5`.

### app/actions

- `PolicySeveritySelectorProps` (type, local) - `app/actions/ModActionPanel/PolicySeveritySelector.tsx:9`.
- `QuickActionProps` (type, exported) - `app/actions/ModActionPanel/useQuickAction.tsx:60`.
- `CompileTemplateInput` (type, exported) - `app/actions/ModActionPanel/useTakedownEmail.tsx:4`.

### app/configure

- `Views` (enum, local) - `app/configure/page-content.tsx:23`.

### app/repositories

- `ReposParams` (type, exported) - `app/repositories/page-content.tsx:44`.
- `ReposData` (type, exported) - `app/repositories/page-content.tsx:49`.
- `ProfilesData` (type, exported) - `app/repositories/page-content.tsx:53`.
- `ReposResponse` (type, exported) - `app/repositories/page-content.tsx:54`.

### components/assignments

- `AssigneeProps` (interface, local) - `components/assignments/Assignee.tsx:12`.
- `AssigneeSearchPopoverProps` (interface, local) - `components/assignments/AssigneeSearchPopover.tsx:18`.
- `QueueAssigneeStatusProps` (interface, local) - `components/assignments/QueueAssigneeStatus.tsx:19`.

### components/common

- `ButtonAppearance` (type, local) - `components/common/buttons.tsx:41`.
- `ButtonSize` (type, local) - `components/common/buttons.tsx:42`.
- `ActionButtonProps` (type, local) - `components/common/buttons.tsx:43`.
- `ButtonGroupItem` (type, local) - `components/common/buttons.tsx:87`.
- `HoldButtonProps` (type, local) - `components/common/buttons.tsx:162`.
- `Variation` (type, exported) - `components/common/Card.tsx:5`.
- `Hint` (type, exported) - `components/common/Card.tsx:6`.
- `DataFieldProps` (type, exported) - `components/common/DataField.tsx:5`.
- `DateRangePreset` (type, exported) - `components/common/DateRangeFilter.tsx:3`.
- `DateRangeValue` (type, exported) - `components/common/DateRangeFilter.tsx:5`.
- `DropdownItem` (type, exported) - `components/common/Dropdown.tsx:6`.
- `LabelProps` (type, local) - `components/common/forms/index.tsx:42`.
- `CopyProps` (type, local) - `components/common/forms/index.tsx:43`.
- `CheckboxProps` (type, local) - `components/common/forms/index.tsx:83`.
- `LabelColorConfig` (interface, local) - `components/common/labels/LabelChip.tsx:6`.
- `LabelChipProps` (interface, exported) - `components/common/labels/LabelChip.tsx:110`.
- `LabelsProps` (type, local) - `components/common/labels/Selector.tsx:163`.
- `ExtendedLabelerServiceDef` (type, exported) - `components/common/labels/util.ts:9`.
- `GraphicMediaFilter` (type, exported) - `components/common/labels/util.ts:75`.
- `CheckboxesModalProps` (type, exported) - `components/common/modals/checkboxes.tsx:12`.
- `ConfirmationModalProps` (type, exported) - `components/common/modals/confirmation.tsx:13`.
- `PaginatedSelectOption` (type, exported) - `components/common/PaginatedSelect.tsx:12`.
- `TypeFilterKey` (type, exported) - `components/common/posts/constants.ts:1`.
- `GalleryEntry` (type, local) - `components/common/posts/GalleryEmbed.tsx:25`.
- `KnownEmbedView` (type, exported) - `components/common/posts/helpers.ts:16`.
- `Mode` (enum, local) - `components/common/posts/Posts.tsx:14`.
- `PostControl` (type, exported) - `components/common/posts/PostsFeed.tsx:90`.
- `ModeratorBadgeProps` (interface, exported) - `components/common/profileStatus/ModeratorBadge.tsx:12`.
- `Props` (type, exported) - `components/common/SetupModal.tsx:7`.
- `RecordWithSnapshotsProps` (interface, local) - `components/common/snapshots/RecordWithSnapshots.tsx:5`.
- `TabView` (type, exported) - `components/common/Tabs.tsx:11`.
- `TabsPanelProps` (type, exported) - `components/common/Tabs.tsx:78`.
- `AnchorProps` (type, local) - `components/common/Tooltip.tsx:10`.
- `TooltipProps` (type, exported) - `components/common/Tooltip.tsx:12`.
- `ColorScheme` (type, exported) - `components/common/useColorScheme.tsx:4`.

### components/communication-template

- `ActionCommunicationTemplatesValue` (type, local) - `components/communication-template/action-template.tsx:18`.

### components/config

- `GroupDropZoneProps` (interface, local) - `components/config/LabelGroups.tsx:15`.
- `LabelGroupsProps` (type, local) - `components/config/LabelGroups.tsx:251`.
- `SafelinkView` (enum, exported) - `components/config/Safelink.tsx:18`.
- `PermissionItemProps` (type, local) - `components/config/server-config.tsx:91`.
- `UrlDisplayProps` (type, local) - `components/config/server-config.tsx:109`.
- `LabelGroup` (type, exported) - `components/config/useLabelGroups.tsx:9`.
- `LabelGroupsSetting` (type, exported) - `components/config/useLabelGroups.tsx:15`.
- `GraphicMediaFilterPreference` (type, exported) - `components/config/useLocalPreferences.tsx:9`.

### components/email

- `RecipientLanguages` (type, local) - `components/email/Composer.tsx:32`.
- `EmailComposerData` (type, exported) - `components/email/helpers.ts:26`.
- `ComposerActionType` (enum, local) - `components/email/useComposer.ts:4`.
- `ComposerAction` (type, local) - `components/email/useComposer.ts:11`.
- `ComposerState` (type, local) - `components/email/useComposer.ts:27`.

### components/list

- `ListAccountsProps` (type, local) - `components/list/Accounts.tsx:11`.

### components/mod-event

- `ModEventType` (type, local) - `components/mod-event/EventItem.tsx:354`.
- `ActionPanelNames` (enum, exported) - `components/mod-event/helpers/emitEvent.tsx:34`.
- `BulkActionResults` (type, local) - `components/mod-event/helpers/emitEvent.tsx:229`.
- `FilterMacro` (type, exported) - `components/mod-event/helpers/macros.ts:5`.
- `StrikeData` (type, local) - `components/mod-event/helpers/useActionRecommendation.tsx:20`.
- `ActionRecommendation` (type, exported) - `components/mod-event/helpers/useActionRecommendation.tsx:29`.
- `ModEventContextType` (interface, local) - `components/mod-event/ModEventContext.tsx:5`.
- `ModToolContextType` (interface, local) - `components/mod-event/ModToolContext.tsx:4`.
- `ModToolInfoProps` (type, local) - `components/mod-event/ModToolInfo.tsx:10`.
- `WorkspaceConfirmationOptions` (type, exported) - `components/mod-event/useModEventList.tsx:27`.
- `ModEventListQueryOptions` (type, exported) - `components/mod-event/useModEventList.tsx:33`.
- `ModEventViewWithDetails` (type, exported) - `components/mod-event/useModEventList.tsx:39`.
- `CommentFilter` (type, local) - `components/mod-event/useModEventList.tsx:44`.
- `EventListState` (type, exported) - `components/mod-event/useModEventList.tsx:146`.
- `EventListFilterPayload` (type, local) - `components/mod-event/useModEventList.tsx:163`.
- `EventListAction` (type, local) - `components/mod-event/useModEventList.tsx:185`.
- `Views` (enum, local) - `components/mod-event/View.tsx:18`.

### components/queues

- `PageState` (type, local) - `components/queues/configure/index.tsx:12`.
- `LogEntry` (type, local) - `components/queues/configure/QueueManagerDialog.tsx:14`.
- `QueueListFilters` (type, exported) - `components/queues/useQueues.ts:11`.

### components/reports

- `Props` (type, local) - `components/reports/AllReportsLinkForSubject.tsx:4`.
- `ReportStatuses` (enum, exported) - `components/reports/constants.ts:1`.
- `CollectionId` (enum, exported) - `components/reports/helpers/subject.ts:114`.
- `ActionErrorKey` (type, exported) - `components/reports/ModerationForm/ActionError.tsx:14`.
- `ActionType` (type, local) - `components/reports/ModerationForm/ActionForm.tsx:13`.
- `ActionFormProps` (interface, local) - `components/reports/ModerationForm/ActionForm.tsx:15`.
- `TakedownOption` (type, local) - `components/reports/ModerationForm/TakedownScheduleSelector.tsx:7`.
- `ModToolFieldConfig` (type, exported) - `components/reports/modToolRegistry.ts:16`.
- `ModToolConfig` (type, exported) - `components/reports/modToolRegistry.ts:21`.
- `ModToolRegistry` (type, exported) - `components/reports/modToolRegistry.ts:37`.
- `ModToolBadgeColor` (type, exported) - `components/reports/modToolRegistry.ts:39`.
- `Props` (type, local) - `components/reports/QueueBadge.tsx:9`.
- `Props` (type, local) - `components/reports/ReassignQueueModal.tsx:20`.
- `ReportActionType` (type, exported) - `components/reports/ReportActions.tsx:28`.
- `ActionType` (type, local) - `components/reports/ReportActions.tsx:65`.
- `ActivityPayload` (type, local) - `components/reports/ReportActions.tsx:401`.
- `ReportFormValues` (type, exported) - `components/reports/ReportPanel.tsx:158`.
- `ReportFormValues` (type, exported) - `components/reports/ReverseActionPanel.tsx:83`.
- `StatGroup` (interface, exported) - `components/reports/stats/index.ts:3`.
- `StatsValuePreset` (type, exported) - `components/reports/stats/Stats.tsx:27`.
- `ReportStats` (interface, exported) - `components/reports/stats/Stats.tsx:59`.
- `Grouping` (type, exported) - `components/reports/stats/StatsFilters.tsx:15`.
- `StatsFilterState` (type, exported) - `components/reports/stats/StatsFilters.tsx:17`.
- `LiveStatsParams` (type, exported) - `components/reports/stats/useReportStats.ts:5`.
- `HistoricalStatsParams` (type, exported) - `components/reports/stats/useReportStats.ts:11`.
- `SearchQueryParams` (type, local) - `components/reports/useFluentReportSearch.ts:4`.
- `AssignmentViewWithModerator` (type, exported) - `components/reports/ViewersIndicator.tsx:14`.

### components/repositories

- `Views` (enum, local) - `components/repositories/AccountView.tsx:70`.
- `FollowOrFollower` (type, local) - `components/repositories/AccountView.tsx:802`.
- `EventViews` (enum, local) - `components/repositories/AccountView.tsx:868`.
- `DidHistoryEvent` (type, local) - `components/repositories/DidHistory.tsx:9`.
- `TypeaheadResult` (type, local) - `components/repositories/Finder.tsx:14`.
- `RepoFinderProps` (type, local) - `components/repositories/Finder.tsx:21`.
- `ManageViewProps` (type, local) - `components/repositories/ManageView.tsx:21`.
- `MatchIndicatorProps` (type, exported) - `components/repositories/MatchIndicator.tsx:10`.
- `Views` (enum, local) - `components/repositories/RecordView.tsx:36`.
- `RecordFallback` (type, exported) - `components/repositories/RecordView.tsx:59`.
- `ReportViews` (enum, local) - `components/repositories/ReportsView.tsx:9`.
- `RevokeCredentialsFormProps` (type, local) - `components/repositories/RevokeCredential.tsx:216`.

### components/safelink

- `FilterPanelProps` (interface, local) - `components/safelink/FilterPanel.tsx:28`.
- `SearchQueryAnalysis` (interface, exported) - `components/safelink/helpers.ts:110`.
- `SafelinkQueryParams` (interface, exported) - `components/safelink/useSafelinkRules.tsx:12`.

### components/scheduled-actions

- `FilterPanelProps` (interface, local) - `components/scheduled-actions/FilterPanel.tsx:7`.
- `ScheduledActionsTableProps` (interface, local) - `components/scheduled-actions/ScheduledActionsTable.tsx:14`.
- `StatusOption` (interface, local) - `components/scheduled-actions/StatusSelector.tsx:14`.
- `StatusSelectorProps` (interface, local) - `components/scheduled-actions/StatusSelector.tsx:26`.

### components/search-content

- `ActorResult` (type, local) - `components/search-content/useContentSearch.tsx:11`.
- `PostResult` (type, local) - `components/search-content/useContentSearch.tsx:12`.
- `SearchContentSection` (type, exported) - `components/search-content/useContentSearch.tsx:13`.
- `QueryData` (type, local) - `components/search-content/useContentSearch.tsx:14`.

### components/SectionHeader.tsx

- `Tab` (interface, local) - `components/SectionHeader.tsx:6`.

### components/setting

- `TargetServicesSelectorProps` (type, local) - `components/setting/policy/TargetServicesSelector.tsx:6`.
- `SeverityLevelConfig` (type, exported) - `components/setting/policy/types.ts:3`.
- `PolicyDetail` (type, exported) - `components/setting/policy/types.ts:9`.
- `PolicyListSetting` (type, exported) - `components/setting/policy/types.ts:19`.
- `ProtectedTagConfig` (type, exported) - `components/setting/protected-tag/types.ts:1`.
- `ProtectedTagSetting` (type, exported) - `components/setting/protected-tag/types.ts:6`.
- `SeverityLevelDetail` (type, exported) - `components/setting/severity-level/types.ts:1`.
- `SeverityLevelListSetting` (type, exported) - `components/setting/severity-level/types.ts:13`.
- `QueueConfig` (type, local) - `components/setting/useQueueSetting.ts:6`.

### components/shell

- `CredentialSignIn` (type, exported) - `components/shell/auth/credential/CredentialSignInForm.tsx:8`.
- `Session` (type, local) - `components/shell/auth/credential/useCredential.ts:4`.
- `OAuthSignIn` (type, exported) - `components/shell/auth/oauth/useOAuth.ts:15`.
- `OnRestored` (type, exported) - `components/shell/auth/oauth/useOAuth.ts:17`.
- `OnSignedIn` (type, exported) - `components/shell/auth/oauth/useOAuth.ts:18`.
- `OnSignedOut` (type, exported) - `components/shell/auth/oauth/useOAuth.ts:19`.
- `ClientOptions` (type, local) - `components/shell/auth/oauth/useOAuth.ts:21`.
- `UseOAuthOptions` (type, exported) - `components/shell/auth/oauth/useOAuth.ts:81`.
- `Profile` (type, exported) - `components/shell/AuthContext.tsx:16`.
- `AuthContext` (type, exported) - `components/shell/AuthContext.tsx:18`.
- `AuthProviderProps` (type, exported) - `components/shell/AuthContext.tsx:29`.
- `ItemBuilderProps` (type, local) - `components/shell/CommandPalette/useAsyncSearch.tsx:36`.
- `SidebarNavChild` (type, exported) - `components/shell/common.ts:35`.
- `SidebarNavItem` (type, exported) - `components/shell/common.ts:41`.
- `ConfigContextData` (type, exported) - `components/shell/ConfigContext.tsx:11`.
- `ConfigurationState` (enum, exported) - `components/shell/ConfigurationContext.tsx:22`.
- `ConfigurationContextData` (type, exported) - `components/shell/ConfigurationContext.tsx:29`.
- `ConfigurationFlowProps` (type, exported) - `components/shell/ConfigurationFlow.tsx:25`.
- `ExternalLabelers` (type, exported) - `components/shell/ExternalLabelersContext.tsx:21`.
- `ExternalLabelersData` (type, exported) - `components/shell/ExternalLabelersContext.tsx:22`.
- `MobileMenuOpen` (interface, local) - `components/shell/MobileMenu.tsx:18`.

### components/subject

- `HighProfileStatusBadgeProps` (type, exported) - `components/subject/HighProfileStatusBadge.tsx:5`.
- `Views` (enum, local) - `components/subject/StatusView.tsx:18`.
- `StatusBySubject` (type, exported) - `components/subject/useSubjectStatus.tsx:24`.

### components/team

- `RolePickerProps` (interface, local) - `components/team/RolePicker.tsx:14`.
- `OnlineModerator` (type, exported) - `components/team/useOnlineModerators.ts:9`.

### components/verification

- `VerificationFilterPanelProps` (type, local) - `components/verification/FilterPanel.tsx:13`.
- `FilterFormState` (type, local) - `components/verification/FilterPanel.tsx:20`.
- `VerificationFilterOptions` (type, exported) - `components/verification/useVerificationList.tsx:6`.
- `VerificationErrorBoundaryProps` (interface, local) - `components/verification/VerificationError.tsx:6`.
- `VerificationErrorBoundary` (class, local) - `components/verification/VerificationError.tsx:11`.

### components/workspace

- `FilterContextType` (type, local) - `components/workspace/FilterContext.tsx:7`.
- `ExportableObject` (type, local) - `components/workspace/hooks.tsx:164`.
- `WorkspaceItemCreatorProps` (interface, local) - `components/workspace/ItemCreator.tsx:11`.
- `WorkspaceListProps` (interface, local) - `components/workspace/List.tsx:26`.
- `DurationUnit` (type, exported) - `components/workspace/types.ts:1`.
- `WorkspaceFilterItem` (type, exported) - `components/workspace/types.ts:3`.
- `FilterOperator` (type, exported) - `components/workspace/types.ts:92`.
- `FilterGroup` (type, exported) - `components/workspace/types.ts:94`.
- `WorkspaceListData` (type, exported) - `components/workspace/useWorkspaceListData.tsx:7`.
- `GroupedSubjects` (type, exported) - `components/workspace/utils.ts:10`.

### cypress/components

- `GetProfile` (type, local) - `cypress/components/lib/profile.cy.ts:10`.
- `GetProfileResponse` (type, local) - `cypress/components/lib/profile.cy.ts:11`.

### cypress/support

- `Chainable` (interface, local) - `cypress/support/component.ts:23`.
- `Chainable` (interface, local) - `cypress/support/index.d.ts:6`.

### lib

- `OzoneMeta` (type, local) - `lib/client-config.ts:125`.
- `OzoneConfig` (type, exported) - `lib/client-config.ts:127`.
- `OzoneConfigFull` (type, exported) - `lib/client-config.ts:144`.
- `CsvContent` (type, exported) - `lib/csv.ts:4`.
- `DidDocData` (type, exported) - `lib/identity.ts:95`.
- `ActorProfile` (type, exported) - `lib/profile.ts:5`.
- `ProfileLookupAgent` (interface, exported) - `lib/profile.ts:11`.
- `ErrorLike` (interface, local) - `lib/profile.ts:38`.
- `ServerConfig` (type, exported) - `lib/server-config.ts:3`.
- `PermissionName` (type, exported) - `lib/server-config.ts:28`.
- `Repo` (type, exported) - `lib/types.ts:12`.
- `SubjectStatus` (type, exported) - `lib/types.ts:16`.
- `InviteCode` (type, exported) - `lib/types.ts:18`.
- `PropsOf` (type, exported) - `lib/types.ts:33`.
- `TakedownTargetService` (type, exported) - `lib/types.ts:39`.
- `RecordSnapshot` (interface, exported) - `lib/useRecordSnapshots.ts:3`.
- `SnapshotResponse` (interface, exported) - `lib/useRecordSnapshots.ts:11`.
- `BlueSkyAppUrlFragments` (type, local) - `lib/util.ts:113`.
- `BatchedOperationOptions` (interface, exported) - `lib/util.ts:249`.
- `BatchedOperationResult` (interface, exported) - `lib/util.ts:269`.

### lib/locale

- `CountryData` (type, local) - `lib/locale/countries.ts:3`.
- `CountryProperty` (type, local) - `lib/locale/countries.ts:14`.
- `Language` (interface, local) - `lib/locale/languages.ts:1`.
