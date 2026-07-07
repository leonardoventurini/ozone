'use client'

import {
  getOptionalProfile,
  PROFILE_CACHE_STALE_TIME_MS,
  type ActorProfile,
} from '@/lib/profile'
import { useLabelerAgent } from '@/shell/ConfigurationContext'
import { useQuery } from '@tanstack/react-query'

/** Props for rendering a compact moderator identity badge. */
export interface ModeratorBadgeProps {
  /** DID to render when profile enrichment is unavailable. */
  did: string
  /** Optional preloaded profile data, used to avoid an extra AppView lookup. */
  profile?: ActorProfile
}

/** Display a user. Attempts to enrich with profile data if not provided. */
export function ModeratorBadge({
  did,
  profile: profileProp,
}: ModeratorBadgeProps) {
  const labelerAgent = useLabelerAgent()
  const { data: fetchedProfile } = useQuery({
    queryKey: ['user', did],
    queryFn: () => getOptionalProfile(labelerAgent, did),
    enabled: !profileProp,
    retry: false,
    staleTime: PROFILE_CACHE_STALE_TIME_MS,
    refetchInterval: PROFILE_CACHE_STALE_TIME_MS,
  })

  const profile = profileProp ?? fetchedProfile

  const displayLabel =
    profile?.displayName || profile?.handle || `${did.slice(0, 20)}...`

  return (
    <span className="w-fit group inline-flex items-center gap-1 rounded bg-gray-100 dark:bg-slate-700 px-2 py-1 text-xs text-gray-700 dark:text-gray-200">
      <img
        className="h-4 w-4 rounded-full"
        src={profile?.avatar || '/img/default-avatar.jpg'}
        alt=""
      />
      {displayLabel}
    </span>
  )
}
