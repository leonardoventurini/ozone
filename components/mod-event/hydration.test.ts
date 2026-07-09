import type { Agent, ToolsOzoneModerationDefs } from '@atproto/api'
import { describe, expect, it, vi } from 'vitest'

import { isFullRecordAtUri } from '@/lib/util'
import { getReposAndRecordsForEvents } from './hydration'

const CREATED_AT = '2026-07-07T00:00:00.000Z'
const MODERATOR_DID = 'did:plc:moderator'
const RECORD_CID = 'bafyreibadrecordcid'
const VALID_RECORD_URI = 'at://did:plc:alice/app.bsky.feed.post/3kabc'
const MALFORMED_RECORD_URI = 'not-a-uri'
const COLLECTION_ONLY_URI = 'at://did:plc:alice/app.bsky.feed.post'

const makeRecordEvent = (
  id: number,
  uri: string,
): ToolsOzoneModerationDefs.ModEventView => ({
  id,
  event: {
    $type: 'tools.ozone.moderation.defs#modEventComment',
    comment: 'historical event',
  },
  subject: {
    $type: 'com.atproto.repo.strongRef',
    uri,
    cid: RECORD_CID,
  },
  subjectBlobCids: [],
  createdBy: MODERATOR_DID,
  createdAt: CREATED_AT,
})

describe('getReposAndRecordsForEvents', () => {
  it('does not forward malformed record-shaped subjects to getRecords', async () => {
    const getRecords = vi.fn(async ({ uris }: { uris: string[] }) => {
      if (uris.some((uri) => !isFullRecordAtUri(uri))) {
        throw new Error('Error: uris/0 must be a valid at-uri')
      }

      return { data: { records: [] } }
    })
    const getRepos = vi.fn(async () => ({ data: { repos: [] } }))
    const agent = {
      tools: {
        ozone: {
          moderation: {
            getRecords,
            getRepos,
          },
        },
      },
    } as unknown as Agent

    await expect(
      getReposAndRecordsForEvents(agent, [
        makeRecordEvent(1, VALID_RECORD_URI),
        makeRecordEvent(2, MALFORMED_RECORD_URI),
        makeRecordEvent(3, COLLECTION_ONLY_URI),
      ]),
    ).resolves.toMatchObject({
      repos: expect.any(Map),
      records: expect.any(Map),
    })

    expect(getRepos).not.toHaveBeenCalled()
    expect(getRecords).toHaveBeenCalledTimes(1)
    expect(getRecords).toHaveBeenCalledWith({ uris: [VALID_RECORD_URI] })
  })
})
