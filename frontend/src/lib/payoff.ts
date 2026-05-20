import type { Leg, Strategy } from './strategy-types'

function legInTheMoney(leg: Leg, settlement: number): boolean {
  if (leg.kind === 'binary') {
    return leg.direction === 'up'
      ? settlement > leg.strike
      : settlement <= leg.strike
  }
  return settlement > leg.lower && settlement <= leg.higher
}

// Single leg PnL
export function legPayoff(leg: Leg, settlement: number): number {
  const grossPayoff = legInTheMoney(leg, settlement) ? leg.qty : 0
  return grossPayoff - leg.cost
}

// Strategy PnL = sum of leg P&Ls.
export function strategyPayoff(strategy: Strategy, settlement: number): number {
  return strategy.legs.reduce((sum, leg) => sum + legPayoff(leg, settlement), 0)
}

export function payoffCurve(
  strategy: Strategy,
  spot: number,
  options: { steps?: number; widthPct?: number } = {},
): { settlement: number; payoff: number }[] {
  const steps = options.steps ?? 200
  const widthPct = options.widthPct ?? 0.5
  const min = spot * (1 - widthPct)
  const max = spot * (1 + widthPct)
  const stride = (max - min) / steps

  const out: { settlement: number; payoff: number }[] = []
  for (let i = 0; i <= steps; i++) {
    const settlement = min + i * stride
    out.push({ settlement, payoff: strategyPayoff(strategy, settlement) })
  }
  return out
}

// Summary metrics for cost preview
export function strategyMetrics(strategy: Strategy, spot: number) {
  const curve = payoffCurve(strategy, spot)
  let maxProfit = -Infinity
  let maxLoss = Infinity
  for (const p of curve) {
    if (p.payoff > maxProfit) maxProfit = p.payoff
    if (p.payoff < maxLoss) maxLoss = p.payoff
  }
  const netCost = strategy.legs.reduce((sum, l) => sum + l.cost, 0)
  return { maxProfit, maxLoss, netCost }
}
