# Best-effort quick action profile enrichment

## Context

The quick action panel loads repo or record moderation data together with an
AppView profile lookup. Labels, blob CIDs, and subject details come from the
moderation repo or record response, while the profile is only contextual UI
enrichment.

When the profile lookup failed, the shared `Promise.all` rejected the whole
subject query. That left the action panel without labels even when the
moderation subject response had loaded successfully.

## Decision

Profile lookup inside the quick action panel is best-effort. Unexpected profile
lookup failures resolve to `undefined` at the action panel boundary, while the
shared `getOptionalProfile` helper keeps its stricter behavior for callers that
need to distinguish real lookup failures.

## Verification

- `corepack yarn test:unit`
- `corepack yarn lint`
- `corepack yarn type-check`
- `NEXT_PUBLIC_APPVIEW_URL=https://public.api.bsky.app NEXT_PUBLIC_DATAPLANE_API_URL=https://api.bsky.app NEXT_PUBLIC_GOAT_URL=https://goat.example.invalid corepack yarn build`
