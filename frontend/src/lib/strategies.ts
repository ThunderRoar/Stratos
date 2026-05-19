import type { Leg, StrategyTemplate } from './strategy-types'

const roundStrike = (x: number) => Math.round(x / 1000) * 1000

export const bullSpread: StrategyTemplate = {
  id: 'bull_spread',
  name: 'Bull Call Spread',
  description: 'Profit if price rises moderately; capped max profit, cheaper than naked UP.',
  buildLegs: (spot) => {
    const k1 = roundStrike(spot * 1.02)
    const k2 = roundStrike(spot * 1.08)
    return [
      { kind: 'binary', side: 'buy',  direction: 'up', strike: k1, qty: 100, cost: 60 },
      { kind: 'binary', side: 'sell', direction: 'up', strike: k2, qty: 100, cost: 30 },
    ] satisfies Leg[]
  }
}

export const bearSpread: StrategyTemplate = {
  id: 'bear_spread',
  name: 'Bear Put Spread',
  description: 'Profit if price falls moderately; capped max profit.',
  buildLegs: (spot) => {
    const k1 = roundStrike(spot * 0.92)
    const k2 = roundStrike(spot * 0.98)
    return [
      { kind: 'binary', side: 'buy',  direction: 'down', strike: k2, qty: 100, cost: 60 },
      { kind: 'binary', side: 'sell', direction: 'down', strike: k1, qty: 100, cost: 30 },
    ] satisfies Leg[]
  }
}

export const straddle: StrategyTemplate = {
  id: 'straddle',
  name: 'Straddle',
  description: 'Profit on any big move; loses if price stays near the strike.',
  buildLegs: (spot) => {
    const k = roundStrike(spot)
    return [
      { kind: 'binary', side: 'buy', direction: 'up',   strike: k, qty: 100, cost: 35 },
      { kind: 'binary', side: 'buy', direction: 'down', strike: k, qty: 100, cost: 35 },
    ] satisfies Leg[]
  }
}

export const strangle: StrategyTemplate = {
  id: 'strangle',
  name: 'Strangle',
  description: 'Cheaper than a straddle; needs a bigger move to profit.',
  buildLegs: (spot) => {
    const kLow  = roundStrike(spot * 0.95)
    const kHigh = roundStrike(spot * 1.05)
    return [
      { kind: 'binary', side: 'buy', direction: 'up',   strike: kHigh, qty: 100, cost: 35 },
      { kind: 'binary', side: 'buy', direction: 'down', strike: kLow,  qty: 100, cost: 35 },
    ] satisfies Leg[]
  }
}

export const ALL_TEMPLATES: StrategyTemplate[] = [bullSpread, bearSpread, straddle, strangle]
