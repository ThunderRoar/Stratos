import type { Strategy } from './strategy-types'
import type { OracleSnapshot } from './predict-types'
import { parseRawSvi, impliedVol } from './svi'
import { binaryCallPrice, yearsFromDays } from './options-math'

const MS_PER_YEAR = 365.25 * 86_400_000

export type EquityPoint = {
  timestampMs: number
  spot: number 
  value: number // current strat value
  pnl: number // value minus initial cost basis
  pnlPct: number // pnl / costBasis
}

// Strategy value at a single snapshot in time using legs + market state
export function strategyValueAtSnapshot(strategy: Strategy, snapshot: OracleSnapshot, oracleExpiryMs: number): number {
  const yearsRemaining = Math.max(0, (oracleExpiryMs - snapshot.timestampMs) / MS_PER_YEAR)
  const spotDollars = snapshot.spot / 1e9
  const forwardDollars = snapshot.forward / 1e9

  // ATM IV at this snapshot
  const sviParams = parseRawSvi(snapshot.svi)
  const atmIv = impliedVol(sviParams, forwardDollars, forwardDollars, yearsFromDays(1))

  return strategy.legs.reduce((sum, leg) => {
    if (leg.kind !== 'binary') return sum
    const p = binaryCallPrice(spotDollars, leg.strike, atmIv, yearsRemaining)
    const v = (leg.direction === 'up' ? p : 1 - p) * leg.qty
    return sum + v
  }, 0)
}

export function backtestStrategy(strategy: Strategy, snapshots: OracleSnapshot[], oracleExpiryMs: number): EquityPoint[] {
  if (snapshots.length === 0) return []
  const costBasis = strategyValueAtSnapshot(strategy, snapshots[0], oracleExpiryMs)
  // Sanity check
  if (costBasis <= 0) return []

  return snapshots.map((s) => {
    const value = strategyValueAtSnapshot(strategy, s, oracleExpiryMs)
    const pnl = value - costBasis
    return {
      timestampMs: s.timestampMs,
      spot: s.spot / 1e9,
      value,
      pnl,
      pnlPct: pnl / costBasis
    }
  })
}
