import { useQuery } from '@tanstack/react-query'
import { getPositions } from '../lib/predict-client'

export function usePositions(managerId: string | null) {
  return useQuery({
    queryKey: ['positions', managerId],
    queryFn: () => getPositions(managerId!),
    enabled: !!managerId,
    staleTime: 6_000,
    refetchInterval: 6_000,
  })
}
