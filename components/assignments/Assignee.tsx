'use client'

import {
  getOptionalProfile,
  PROFILE_CACHE_STALE_TIME_MS,
} from '@/lib/profile'
import { useLabelerAgent } from '@/shell/ConfigurationContext'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useQuery } from '@tanstack/react-query'

/** Props for rendering a compact assignee identity chip. */
interface AssigneeProps {
  /** DID to render when profile enrichment is unavailable. */
  did: string
  /** Optional removal callback shown as an affordance on hover. */
  onRemove?: () => void
}

export function Assignee({ did, onRemove }: AssigneeProps) {
  const labelerAgent = useLabelerAgent()
  const { data: profile } = useQuery({
    queryKey: ['assignee', did],
    queryFn: () => getOptionalProfile(labelerAgent, did),
    retry: false,
    staleTime: PROFILE_CACHE_STALE_TIME_MS,
    refetchInterval: PROFILE_CACHE_STALE_TIME_MS,
  })

  const displayLabel =
    profile?.displayName || profile?.handle || `${did.slice(0, 20)}...`

  return (
    <span className="group inline-flex items-center gap-1 rounded bg-gray-100 dark:bg-slate-700 px-2 py-1 text-xs text-gray-700 dark:text-gray-200">
      <img
        className="h-4 w-4 rounded-full"
        src={profile?.avatar || '/img/default-avatar.jpg'}
        alt=""
      />
      {displayLabel}
      {onRemove && (
        <button
          onClick={onRemove}
          className="hidden group-hover:inline-flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-100"
        >
          <XMarkIcon className="h-3 w-3" />
        </button>
      )}
    </span>
  )
}
