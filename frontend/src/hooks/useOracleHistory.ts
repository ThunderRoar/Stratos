import { useQuery } from '@tanstack/react-query'
import { getOraclePriceHistory, getOracleSviHistory } from '../lib/predict-client'
import { joinPricesAndSvi } from '../lib/oracle-history'
import type { OracleSnapshot } from '../lib/predict-types'

// Fetches the most recent N price + SVI events and merges them into snapshots
export function useOracleHistory(oracleId: string | null, limit = 1000) {
  return useQuery({
    queryKey: ['oracle-history', oracleId, limit],
    queryFn: async (): Promise<OracleSnapshot[]> => {
      if (!oracleId) throw new Error('no oracle')
      const [prices, svi] = await Promise.all([
        getOraclePriceHistory(oracleId, limit),
        getOracleSviHistory(oracleId, limit),
      ])
      return joinPricesAndSvi(prices, svi)
    },
    enabled: !!oracleId,
    staleTime: 60_000
  })
}
