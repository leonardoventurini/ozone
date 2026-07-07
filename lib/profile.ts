import type { Agent, AppBskyActorDefs } from '@atproto/api'
import { ResponseType } from '@atproto/xrpc'

/** Profile shapes accepted by compact account UI components. */
export type ActorProfile =
  | AppBskyActorDefs.ProfileView
  | AppBskyActorDefs.ProfileViewBasic
  | AppBskyActorDefs.ProfileViewDetailed

/** Minimal agent contract required to fetch an actor profile. */
export interface ProfileLookupAgent {
  app: {
    bsky: {
      actor: {
        getProfile: Agent['app']['bsky']['actor']['getProfile']
      }
    }
  }
}

/** Number of minutes to keep optional profile enrichments fresh. */
const PROFILE_CACHE_TTL_MINUTES: number = 5

/** Milliseconds in one minute, kept named so profile cache windows read clearly. */
const MILLISECONDS_PER_MINUTE: number = 60_000

/** Shared freshness window for optional profile enrichments. */
export const PROFILE_CACHE_STALE_TIME_MS: number =
  PROFILE_CACHE_TTL_MINUTES * MILLISECONDS_PER_MINUTE

/** The AppView reports missing actor profiles as an invalid request. */
const PROFILE_NOT_FOUND_MESSAGE: string = 'Profile not found'

/** Takedown profiles are intentionally unavailable but the repo can still render. */
const ACCOUNT_TAKEDOWN_ERROR: string = 'AccountTakedown'

/** Loose XRPC error shape used by SDK errors and test doubles. */
interface ErrorLike {
  error?: unknown
  message?: unknown
  status?: unknown
}

/** Returns true for profile lookups where fallback DID rendering is expected. */
export function isMissingProfileError(error: unknown): boolean {
  if (!isErrorLike(error)) {
    return false
  }

  return (
    error.error === ACCOUNT_TAKEDOWN_ERROR ||
    (error.status === ResponseType.InvalidRequest &&
      error.message === PROFILE_NOT_FOUND_MESSAGE)
  )
}

/** Fetches a profile when available while preserving real lookup failures. */
export async function getOptionalProfile(
  agent: ProfileLookupAgent,
  actor: string,
): Promise<AppBskyActorDefs.ProfileViewDetailed | undefined> {
  try {
    const { data } = await agent.app.bsky.actor.getProfile({ actor })
    return data
  } catch (error) {
    if (isMissingProfileError(error)) {
      return undefined
    }

    throw error
  }
}

/** Narrows unknown thrown values to the fields used by XRPC errors. */
function isErrorLike(error: unknown): error is ErrorLike {
  return typeof error === 'object' && error !== null
}
