export type LegSide = 'buy' | 'sell'
export type BinaryDirection = 'up' | 'down'

export type BinaryLeg = {
  kind: 'binary'
  side: LegSide
  direction: BinaryDirection
  strike: number // dollar amount, e.g. 80000
  qty: number // contracts (max payout in USD)
  cost: number // premium paid (buy) or received (sell) in USD
}

export type RangeLeg = {
  kind: 'range'
  side: LegSide
  lower: number
  higher: number
  qty: number
  cost: number
}

export type Leg = BinaryLeg | RangeLeg

export type Strategy = {
  templateId: string // bull spread, bear_spread .etc
  legs: Leg[]
}

export type StrategyTemplate = {
  id: string
  name: string
  description: string  // one-line market view
  buildLegs: (spot: number) => Leg[]
}
