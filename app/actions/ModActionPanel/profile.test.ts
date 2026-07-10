import type { AppBskyActorDefs } from '@atproto/api'
import { describe, expect, it } from 'vitest'

import type { ProfileLookupAgent } from '@/lib/profile'
import { getBestEffortActionProfile } from './profile'

type GetProfile = ProfileLookupAgent['app']['bsky']['actor']['getProfile']
type GetProfileResponse = Awaited<ReturnType<GetProfile>>

const ACTOR_DID = 'did:plc:subject'

const PROFILE: AppBskyActorDefs.ProfileViewDetailed = {
  did: ACTOR_DID,
  handle: 'subject.test',
}

const createAgent = (getProfile: GetProfile): ProfileLookupAgent => ({
  app: {
    bsky: {
      actor: {
        getProfile,
      },
    },
  },
})

const createProfileResponse = (
  profile: AppBskyActorDefs.ProfileViewDetailed,
): GetProfileResponse => ({ data: profile }) as GetProfileResponse

describe('getBestEffortActionProfile', () => {
  it('returns profile data when enrichment succeeds', async () => {
    const getProfile: GetProfile = async () => createProfileResponse(PROFILE)

    await expect(
      getBestEffortActionProfile(createAgent(getProfile), ACTOR_DID),
    ).resolves.toEqual(PROFILE)
  })

  it('does not reject when profile enrichment fails', async () => {
    const getProfile: GetProfile = async () => {
      throw new Error('profile service unavailable')
    }

    await expect(
      getBestEffortActionProfile(createAgent(getProfile), ACTOR_DID),
    ).resolves.toBeUndefined()
  })
})
