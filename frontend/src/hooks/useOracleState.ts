import { useQuery } from '@tanstack/react-query'
import { getOracleState } from '../lib/predict-client'

export function useOracleState(oracleId: string | undefined) {
  return useQuery({
    queryKey: ['oracle-state', oracleId],
    queryFn: () => getOracleState(oracleId!),
    enabled: !!oracleId,
    refetchInterval: 10_000,
  })
}
