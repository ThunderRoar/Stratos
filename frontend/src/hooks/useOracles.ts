import { useQuery } from '@tanstack/react-query'
import { getOracles } from '../lib/predict-client'

export function useOracles() {
  return useQuery({
    queryKey: ['oracles'],
    queryFn: () => getOracles(),
    staleTime: 30_000,
  })
}
