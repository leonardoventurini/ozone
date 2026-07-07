import type { Agent } from '@atproto/api'
import {
  ChatBskyConvoDefs,
  ComAtprotoAdminDefs,
  ComAtprotoRepoStrongRef,
  ToolsOzoneModerationDefs,
} from '@atproto/api'

import { chunkArray, isFullRecordAtUri } from '@/lib/util'

const MODERATION_HYDRATION_CHUNK_SIZE = 50

/**
 * Unique moderation event subjects that can be hydrated through Ozone bulk
 * lookup endpoints.
 */
export type ModEventHydrationTargets = {
  repoDids: string[]
  recordUris: string[]
}

/**
 * Hydrated moderation event subject details keyed by their original subject
 * identifiers.
 */
export type ModEventHydrationDetails = {
  repos: Map<string, ToolsOzoneModerationDefs.RepoViewDetail | undefined>
  records: Map<string, ToolsOzoneModerationDefs.RecordViewDetail | undefined>
}

/**
 * Collects unique repo DID and record URI hydration targets from moderation
 * events.
 */
export function getModEventHydrationTargets(
  events: ToolsOzoneModerationDefs.ModEventView[],
): ModEventHydrationTargets {
  const repoDids = new Set<string>()
  const recordUris = new Set<string>()

  for (const event of events) {
    if (
      ComAtprotoAdminDefs.isRepoRef(event.subject) ||
      ChatBskyConvoDefs.isMessageRef(event.subject)
    ) {
      repoDids.add(event.subject.did)
    } else if (
      ComAtprotoRepoStrongRef.isMain(event.subject) &&
      isFullRecordAtUri(event.subject.uri)
    ) {
      recordUris.add(event.subject.uri)
    }
  }

  return {
    repoDids: Array.from(repoDids),
    recordUris: Array.from(recordUris),
  }
}

/**
 * Hydrates moderation event repo and record subjects without changing the
 * original event order.
 */
export async function getReposAndRecordsForEvents(
  labelerAgent: Agent,
  events: ToolsOzoneModerationDefs.ModEventView[],
): Promise<ModEventHydrationDetails> {
  const { repoDids, recordUris } = getModEventHydrationTargets(events)
  const repos = new Map<
    string,
    ToolsOzoneModerationDefs.RepoViewDetail | undefined
  >(repoDids.map((did) => [did, undefined]))
  const records = new Map<
    string,
    ToolsOzoneModerationDefs.RecordViewDetail | undefined
  >(recordUris.map((uri) => [uri, undefined]))
  const fetchers: Array<Promise<void>> = []

  // Right now, we're only loading 25 events at a time so this chunking never
  // really takes effect. This keeps the helper safe if page size changes later.
  if (repos.size) {
    for (const chunk of chunkArray(
      Array.from(repos.keys()),
      MODERATION_HYDRATION_CHUNK_SIZE,
    )) {
      fetchers.push(
        labelerAgent.tools.ozone.moderation
          .getRepos({ dids: chunk })
          .then(({ data }) => {
            for (const repo of data.repos) {
              if (ToolsOzoneModerationDefs.isRepoViewDetail(repo)) {
                repos.set(repo.did, repo)
              }
            }
          }),
      )
    }
  }

  if (records.size) {
    for (const chunk of chunkArray(
      Array.from(records.keys()),
      MODERATION_HYDRATION_CHUNK_SIZE,
    )) {
      fetchers.push(
        labelerAgent.tools.ozone.moderation
          .getRecords({ uris: chunk })
          .then(({ data }) => {
            for (const record of data.records) {
              if (ToolsOzoneModerationDefs.isRecordViewDetail(record)) {
                records.set(record.uri, record)
              }
            }
          }),
      )
    }
  }

  await Promise.all(fetchers)

  return { repos, records }
}
