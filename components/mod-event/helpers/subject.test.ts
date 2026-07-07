import type { ToolsOzoneModerationDefs } from '@atproto/api'
import { describe, expect, it } from 'vitest'

import { getSubjectTitle } from './subject'

const RECORD_CID = 'bafyreibadrecordcid'

const makeRecordSubject = (
  uri: string,
): ToolsOzoneModerationDefs.ModEventView['subject'] => ({
  $type: 'com.atproto.repo.strongRef',
  uri,
  cid: RECORD_CID,
})

describe('getSubjectTitle', () => {
  it('falls back for malformed record-shaped subjects', () => {
    expect(getSubjectTitle(makeRecordSubject('not-a-uri'))).toBe('Subject')
  })

  it('falls back for collection-only record-shaped subjects', () => {
    expect(
      getSubjectTitle(
        makeRecordSubject('at://did:plc:alice/app.bsky.feed.post'),
      ),
    ).toBe('Subject')
  })
})
