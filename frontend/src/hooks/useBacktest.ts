import { useMemo } from 'react'
import { useOracleHistory } from './useOracleHistory'
import { backtestStrategy, type EquityPoint } from '../lib/backtest'
import { withinWindow, downsample } from '../lib/oracle-history'
import type { Strategy } from '../lib/strategy-types'

export function useBacktest(
  oracleId: string | null,
  strategy: Strategy | null,
  oracleExpiryMs: number | null,
  windowMs: number
): {
  data: EquityPoint[]
  isLoading: boolean
  error: Error | null
} {
  const { data: history, isLoading, error } = useOracleHistory(oracleId, 10_000)

  const data = useMemo(() => {
    if (!history || !strategy || oracleExpiryMs == null) return []
    const fromMs = Date.now() - windowMs
    const windowed = withinWindow(history, fromMs)
    const sampled = downsample(windowed, 150)
    return backtestStrategy(strategy, sampled, oracleExpiryMs)
  }, [history, strategy, oracleExpiryMs, windowMs])

  return { data, isLoading, error: (error as Error | null) ?? null }
}
