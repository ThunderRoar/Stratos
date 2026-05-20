export type BinaryDirection = 'up' | 'down'

// Every leg is a BUY (mint). Predict has no short/sell so the vault is always
// the counterparty. Strategies compose payoffs by combining UP and DOWN buys
// at chosen strikes.

export type BinaryLeg = {
  kind: 'binary'
  direction: BinaryDirection
  strike: number // dollar amount, e.g. 80000
  qty: number // contracts (max payout in USD)
  cost: number // premium paid in USD (seeded mock until chain quote arrives)
}

export type RangeLeg = {
  kind: 'range'
  lower: number
  higher: number
  qty: number
  cost: number
}

export type Leg = BinaryLeg | RangeLeg

export type Strategy = {
  templateId: string
  legs: Leg[]
}

export type StrategyTemplate = {
  id: string
  name: string
  description: string  // one-line market view
  buildLegs: (spot: number) => Leg[]
}
