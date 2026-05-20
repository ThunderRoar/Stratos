import { useQuery } from '@tanstack/react-query'
import { useCurrentAccount } from '@mysten/dapp-kit-react'
import { getManagersByOwner } from '../lib/predict-client'

export function usePredictManager() {
  const account = useCurrentAccount()

  const query = useQuery({
    queryKey: ['predict-manager', account?.address],
    queryFn: async () => {
      if (!account) return null
      const managers = await getManagersByOwner(account.address)
      managers.sort((a, b) => a.checkpoint_timestamp_ms - b.checkpoint_timestamp_ms)
      return managers[0]?.manager_id ?? null
    },
    enabled: !!account,
    staleTime: 30_000
  })

  return {
    managerId: query.data ?? null,
    isLoading: query.isLoading,
    refetch: query.refetch,
  }
}
