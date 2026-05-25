import { useMemo } from 'react'
import { useOracleHistory } from './useOracleHistory'
import { backtestStrategy, type EquityPoint } from '../lib/backtest'
import { withinWindow, downsample } from '../lib/oracle-history'
import type { Strategy } from '../lib/strategy-types'

export function useBacktest(
  oracleId: string | null,
  strategy: Strategy | null,
  oracleExpiryMs: number | null,
  windowDays: number,
): {
  data: EquityPoint[]
  isLoading: boolean
  error: Error | null
} {
  const { data: history, isLoading, error } = useOracleHistory(oracleId)

  const data = useMemo(() => {
    if (!history || !strategy || oracleExpiryMs == null) return []
    // Window the snapshots to the chosen lookback period.
    const fromMs = Date.now() - windowDays * 86_400_000
    const windowed = withinWindow(history, fromMs)
    // Downsample to keep the chart fast — ~150 points is plenty for a smooth curve.
    const sampled = downsample(windowed, 150)
    return backtestStrategy(strategy, sampled, oracleExpiryMs)
  }, [history, strategy, oracleExpiryMs, windowDays])

  return { data, isLoading, error: (error as Error | null) ?? null }
}
