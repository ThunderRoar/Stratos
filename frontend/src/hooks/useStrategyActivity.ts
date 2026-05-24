import { useQuery } from '@tanstack/react-query'
import { useCurrentClient } from '@mysten/dapp-kit-react'
import { STRATOS_PACKAGE_ID } from '../config/constants'

export type StrategyActivityRow = {
  strategyType: string // can be the 4 strategies defined
  manager: string // id
  oracle: string // id
  legCount: number
  timestampMs: number
  txDigest: string
  sender: string
}

export function useStrategyActivity(limit = 50) {
  const client = useCurrentClient()

  return useQuery({
    queryKey: ['strategy-activity', STRATOS_PACKAGE_ID, limit],
    queryFn: async (): Promise<StrategyActivityRow[]> => {
      const res = await client.queryEvents({
        query: { MoveEventType: `${STRATOS_PACKAGE_ID}::executor::StrategyExecuted` },
        limit,
        order: 'descending'
      })

      return res.data.map((evt) => {
        const json = evt.parsedJson as {
          strategy_type: number[]
          manager: string
          oracle: string
          leg_count: string
          timestamp_ms: string
        }
        return {
          strategyType: String.fromCharCode(...json.strategy_type),
          manager: json.manager,
          oracle: json.oracle,
          legCount: Number(json.leg_count),
          timestampMs: Number(json.timestamp_ms),
          txDigest: evt.id.txDigest,
          sender: evt.sender
        }
      })
    },
    staleTime: 5_000,
    refetchInterval: 5_000
  })
}
