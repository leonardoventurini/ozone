import { describe, expect, it } from 'vitest'

import { isFullRecordAtUri } from './util'

describe('isFullRecordAtUri', () => {
  it('accepts full record AT URIs', () => {
    expect(
      isFullRecordAtUri('at://did:plc:alice/app.bsky.feed.post/3kabc'),
    ).toBe(true)
  })

  it('rejects malformed AT URIs', () => {
    expect(isFullRecordAtUri('not-a-uri')).toBe(false)
  })

  it('rejects collection-only AT URIs', () => {
    expect(
      isFullRecordAtUri('at://did:plc:alice/app.bsky.feed.post'),
    ).toBe(false)
  })
})
