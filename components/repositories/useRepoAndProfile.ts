import { getDidFromHandle } from '@/lib/identity'
import { getOptionalProfile, PROFILE_CACHE_STALE_TIME_MS } from '@/lib/profile'
import { useLabelerAgent } from '@/shell/ConfigurationContext'
import { useQuery } from '@tanstack/react-query'

export const useRepoAndProfile = ({ id }: { id?: string }) => {
  const labelerAgent = useLabelerAgent()
  return useQuery({
    queryKey: ['accountView', { id }],
    enabled: !!id,
    queryFn: async () => {
      if (!id) {
        return { repo: undefined, profile: undefined }
      }

      const getRepo = async () => {
        let did
        if (id.startsWith('did:')) {
          did = id
        } else {
          did = await getDidFromHandle(id)
        }
        const { data: repo } =
          await labelerAgent.api.tools.ozone.moderation.getRepo({ did })
        return repo
      }
      const getProfile = () => getOptionalProfile(labelerAgent, id)
      const [repo, profile] = await Promise.all([getRepo(), getProfile()])
      return { repo, profile }
    },
    staleTime: PROFILE_CACHE_STALE_TIME_MS,
  })
}
