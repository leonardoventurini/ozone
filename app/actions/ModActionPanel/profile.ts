import type { AppBskyActorDefs } from '@atproto/api'

import { getOptionalProfile, type ProfileLookupAgent } from '@/lib/profile'

/**
 * Quick action profile data is contextual enrichment and must not block core
 * moderation subject data such as repo, record, labels, and blob CIDs.
 */
export async function getBestEffortActionProfile(
  agent: ProfileLookupAgent,
  actor: string,
): Promise<AppBskyActorDefs.ProfileViewDetailed | undefined> {
  try {
    return await getOptionalProfile(agent, actor)
  } catch {
    return undefined
  }
}
