import type { AppBskyActorDefs } from '@atproto/api'
import { ResponseType } from '@atproto/xrpc'

import {
  getOptionalProfile,
  isMissingProfileError,
  type ProfileLookupAgent,
} from '../../../lib/profile'

type GetProfile = ProfileLookupAgent['app']['bsky']['actor']['getProfile']
type GetProfileResponse = Awaited<ReturnType<GetProfile>>

const ACTOR_DID = 'did:plc:testmoderator'

const PROFILE: AppBskyActorDefs.ProfileViewDetailed = {
  did: ACTOR_DID,
  handle: 'moderator.test',
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
): GetProfileResponse => ({ data: profile } as GetProfileResponse)

describe('profile helpers', () => {
  it('returns profile data when lookup succeeds', () => {
    const getProfile: GetProfile = async () => createProfileResponse(PROFILE)

    return getOptionalProfile(createAgent(getProfile), ACTOR_DID).then(
      (profile) => {
        expect(profile).to.deep.equal(PROFILE)
      },
    )
  })

  it('returns undefined when the AppView reports a missing profile', () => {
    const getProfile: GetProfile = async () => {
      throw {
        message: 'Profile not found',
        status: ResponseType.InvalidRequest,
      }
    }

    return getOptionalProfile(createAgent(getProfile), ACTOR_DID).then(
      (profile) => {
        expect(profile).to.equal(undefined)
      },
    )
  })

  it('returns undefined when the actor profile is unavailable after takedown', () => {
    const getProfile: GetProfile = async () => {
      throw {
        error: 'AccountTakedown',
      }
    }

    return getOptionalProfile(createAgent(getProfile), ACTOR_DID).then(
      (profile) => {
        expect(profile).to.equal(undefined)
      },
    )
  })

  it('rethrows unexpected profile lookup errors', () => {
    const error = new Error('network failed')
    const getProfile: GetProfile = async () => {
      throw error
    }

    return getOptionalProfile(createAgent(getProfile), ACTOR_DID).then(
      () => {
        throw new Error('Expected getOptionalProfile to reject')
      },
      (caught: unknown) => {
        expect(caught).to.equal(error)
      },
    )
  })

  it('classifies only known missing-profile errors as expected misses', () => {
    expect(
      isMissingProfileError({
        message: 'Profile not found',
        status: ResponseType.InvalidRequest,
      }),
    ).to.equal(true)
    expect(isMissingProfileError({ error: 'AccountTakedown' })).to.equal(true)
    expect(isMissingProfileError(new Error('network failed'))).to.equal(false)
  })
})
