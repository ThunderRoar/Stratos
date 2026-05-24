import type { Leg, StrategyTemplate } from './strategy-types'

const roundStrike = (x: number) => Math.round(x / 1000) * 1000

// Scale strike offsets by sqrt(T) normalized to 30 day reference
// as expected price move scales with sqrt(time). A strike that's "reasonable"
// 30 days out is unreachable in 1 hour. This keeps strikes at consistent
// probability of crossing across all oracle expiries
const REFERENCE_YEARS = 30 / 365.25
const scaleByExpiry = (years: number) =>
  Math.sqrt(Math.max(years, 1 / (365.25 * 24)) / REFERENCE_YEARS)  // floor at 1 hour to avoid scale=0

// Bull bet: payoff steps up as price rises through each strike
// Construction: BUY UP K1 + BUY UP K2  (K1 < K2)
export const bullLadder: StrategyTemplate = {
  id: 'bull_ladder',
  name: 'Bull Ladder',
  description: 'Profit climbs as BTC rises past each strike. Bigger move = bigger win.',
  buildLegs: (spot, years) => {
    const s = scaleByExpiry(years)
    const k1 = roundStrike(spot * (1 + 0.03 * s))
    const k2 = roundStrike(spot * (1 + 0.06 * s))
    return [
      { kind: 'binary', direction: 'up', strike: k1, qty: 100, cost: 35 },
      { kind: 'binary', direction: 'up', strike: k2, qty: 100, cost: 20 },
    ] satisfies Leg[]
  },
}

// Bear bet: payoff steps up as price falls through each strike
// Construction: BUY DOWN K1 + BUY DOWN K2  (K1 > K2, both below spot)
export const bearLadder: StrategyTemplate = {
  id: 'bear_ladder',
  name: 'Bear Ladder',
  description: 'Profit climbs as BTC falls past each strike. Bigger drop = bigger win.',
  buildLegs: (spot, years) => {
    const s = scaleByExpiry(years)
    const k1 = roundStrike(spot * (1 - 0.03 * s))
    const k2 = roundStrike(spot * (1 - 0.06 * s))
    return [
      { kind: 'binary', direction: 'down', strike: k1, qty: 100, cost: 35 },
      { kind: 'binary', direction: 'down', strike: k2, qty: 100, cost: 20 },
    ] satisfies Leg[]
  },
}

// Volatility bet: profits on a big move in EITHER direction; loses if BTC drifts
// Construction: BUY UP K_high + BUY DOWN K_low (K_high > K_low)
export const strangle: StrategyTemplate = {
  id: 'strangle',
  name: 'Strangle',
  description: 'Profit if BTC moves sharply in either direction. Loses if it stays still.',
  buildLegs: (spot, years) => {
    const s = scaleByExpiry(years)
    const kLow = roundStrike(spot * (1 - 0.05 * s))
    const kHigh = roundStrike(spot * (1 + 0.05 * s))
    return [
      { kind: 'binary', direction: 'up', strike: kHigh, qty: 100, cost: 25 },
      { kind: 'binary', direction: 'down', strike: kLow, qty: 100, cost: 25 },
    ] satisfies Leg[]
  },
}

// Mean reversion bet: profits if BTC stays within a band, loses on a big move.
// Construction: BUY UP K_low + BUY DOWN K_high  (K_high > K_low)
// In the middle band both legs are ITM and double up
export const rangeBet: StrategyTemplate = {
  id: 'range_bet',
  name: 'Range Bet',
  description: 'Profit if BTC stays inside the band. Loses on a sharp breakout.',
  buildLegs: (spot, years) => {
    const s = scaleByExpiry(years)
    const kLow = roundStrike(spot * (1 - 0.03 * s))
    const kHigh = roundStrike(spot * (1 + 0.03 * s))
    return [
      { kind: 'binary', direction: 'up', strike: kLow, qty: 100, cost: 65 },
      { kind: 'binary', direction: 'down', strike: kHigh, qty: 100, cost: 65 },
    ] satisfies Leg[]
  },
}

export const ALL_TEMPLATES: StrategyTemplate[] = [bullLadder, bearLadder, strangle, rangeBet]
