import { useQuery } from '@tanstack/react-query'
import { getVaultSummary, getVaultPerformance } from '../lib/predict-client'

export function useVaultSummary() {
  return useQuery({
    queryKey: ['vault', 'summary'],
    queryFn: () => getVaultSummary(),
    staleTime: 5_000,
    refetchInterval: 15_000,
  })
}

export function useVaultPerformance(range: string = 'ALL') {
  return useQuery({
    queryKey: ['vault', 'performance', range],
    queryFn: () => getVaultPerformance(undefined, range),
    staleTime: 60_000,
  })
}
