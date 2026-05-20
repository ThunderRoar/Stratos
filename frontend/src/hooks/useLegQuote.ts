import { useQueries } from '@tanstack/react-query'
import { useCurrentClient } from '@mysten/dapp-kit-react'
import type { Leg } from '../lib/strategy-types'
import type { Oracle } from '../lib/predict-types'
import { quoteBinary, type Quote } from '../lib/predict-quote'

export function useLegQuotes(legs: Leg[], oracle: Oracle | null) {
  const client = useCurrentClient()

  return useQueries({
    queries: legs.map((leg) => ({
      queryKey: ['leg-quote', oracle?.oracle_id, legSignature(leg)],
      queryFn: async (): Promise<Quote> => {
        if (!oracle) throw new Error('no oracle')
        if (leg.kind !== 'binary') throw new Error('range quotes not implemented')
        return quoteBinary(client, {
          oracleId: oracle.oracle_id,
          expiry: oracle.expiry,
          strike: Math.round(leg.strike * 1e9),
          isUp: leg.direction === 'up',
          quantity: Math.round(leg.qty * 1e6) // dollars to raw 6 decimal DUSDC
        })
      },
      enabled: !!oracle && leg.kind === 'binary',
      staleTime: 30_000,
    })),
  })
}

function legSignature(leg: Leg): string {
  if (leg.kind === 'binary') {
    return `b|${leg.direction}|${leg.strike}|${leg.qty}`
  }
  return `r|${leg.lower}|${leg.higher}|${leg.qty}`
}
