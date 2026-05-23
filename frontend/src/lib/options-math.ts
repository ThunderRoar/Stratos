import type { Leg, Strategy } from './strategy-types'
import { legPayoff } from './payoff'

// Time horizon helpers
const DAYS_PER_YEAR = 365.25
const MS_PER_DAY = 86_400_000

export const yearsFromDays = (days: number) => days / DAYS_PER_YEAR

export const yearsToExpiryFromMs = (expiryMs: number, nowMs = Date.now()) => {
  const ms = Math.max(0, expiryMs - nowMs)
  return ms / (MS_PER_DAY * DAYS_PER_YEAR)
}

// Standard +-1 sigma expected price move under GBM (the lognormal approximation
// is fine for horizons <= ~90 days at typical crypto vols).
//
// Inputs:
//   spot - current price in dollars
//   atmVol - annualized IV at the forward, as a decimal (0.45 = 45%)
//   years - time horizon in years
// Returns:
//   the +-1 sigma dollar move (e.g. 1810 means [-1810, +1810] is the 68% band)
export function expectedMoveDollars(spot: number, atmVol: number, years: number): number {
  return spot * atmVol * Math.sqrt(years)
}

// Standard normal PDF: phi(x) = (1/sqrt(2pi)) · e^(-x^2/2)
export function normalPdf(x: number): number {
  return Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI)
}

// Standard normal CDF (max error ~7.5e-8).
// Why this approximation: erf() isn't in the standard JS Math lib, and a 5-term polynomial here is faster than importing a numerical library
export function normalCdf(x: number): number {
  if (x < 0) return 1 - normalCdf(-x)
  const k = 1 / (1 + 0.2316419 * x)
  const k2 = k * k
  const k3 = k2 * k
  const k4 = k3 * k
  const k5 = k4 * k
  const w = 0.319381530 * k - 0.356563782 * k2 + 1.781477937 * k3 - 1.821255978 * k4 + 1.330274429 * k5
  return 1 - normalPdf(x) * w
}

// d2 from Black Scholes, with r = 0 (standard for crypto - no risk free rate to anchor).
function d2(spot: number, strike: number, sigma: number, years: number): number {
  const sigmaRootT = sigma * Math.sqrt(years)
  return (Math.log(spot / strike) - sigma * sigma * years / 2) / sigmaRootT
}

// Price of a binary cash or nothing call (pays 1 if settlement > strike).
// Equals the risk-neutral probability of ITM.
export function binaryCallPrice(spot: number, strike: number, sigma: number, years: number): number {
  if (years <= 0) return spot > strike ? 1 : 0
  return normalCdf(d2(spot, strike, sigma, years))
}

// Delta of the binary call. Peaks at the strike, asymptotes to 0 far from it.
// Returns per-unit-qty sensitivity ($ change in position value per $1 spot move).
export function binaryCallDelta(spot: number, strike: number, sigma: number, years: number): number {
  if (years <= 0) return 0
  const d = d2(spot, strike, sigma, years)
  return normalPdf(d) / (spot * sigma * Math.sqrt(years))
}

// Theta of the binary call, expressed in dollars per day. Negative = value bleeds with time.
export function binaryCallThetaPerDay(spot: number, strike: number, sigma: number, years: number): number {
  if (years <= 0) return 0
  const sigmaRootT = sigma * Math.sqrt(years)
  const d2v = d2(spot, strike, sigma, years)
  const d1v = d2v + sigmaRootT
  const thetaPerYear = -normalPdf(d2v) * d1v / (2 * years)
  return thetaPerYear / 365.25
}

// Max profit = every leg wins
export function strategyMaxProfit(strategy: Strategy): number {
  return strategy.legs.reduce((sum, l) => sum + l.qty - l.cost, 0)
}

// Max loss = every leg loses (mint-only floor)
export function strategyMaxLoss(strategy: Strategy): number {
  return strategy.legs.reduce((sum, l) => sum + l.cost, 0)
}

// Per leg Delta. For mint-only positions, a BUY UP gets Delta = +binaryCallDelta * qty,
// a BUY DOWN gets Delta = -binaryCallDelta * qty
export function legDelta(leg: Leg, spot: number, sigma: number, years: number): number {
  if (leg.kind !== 'binary') return 0  // range legs: skip for now
  const d = binaryCallDelta(spot, leg.strike, sigma, years)
  const signed = leg.direction === 'up' ? d : -d
  return signed * leg.qty
}

// Per leg Theta per day. DOWN legs flip the sign
export function legThetaPerDay(leg: Leg, spot: number, sigma: number, years: number): number {
  if (leg.kind !== 'binary') return 0
  const t = binaryCallThetaPerDay(spot, leg.strike, sigma, years)
  const signed = leg.direction === 'up' ? t : -t
  return signed * leg.qty
}

// Strategy Delta = sum of leg deltas
export function strategyDelta(strategy: Strategy, spot: number, sigma: number, years: number): number {
  return strategy.legs.reduce((sum, l) => sum + legDelta(l, spot, sigma, years), 0)
}

// Strategy Theta per day
export function strategyThetaPerDay(strategy: Strategy, spot: number, sigma: number, years: number): number {
  return strategy.legs.reduce((sum, l) => sum + legThetaPerDay(l, spot, sigma, years), 0)
}

// PoP via Monte Carlo. Samples N spot prices from the lognormal distribution
// at expiry, computes payoff, counts winners
export function strategyProbabilityOfProfit(
  strategy: Strategy,
  spot: number,
  sigma: number,
  years: number,
  samples = 5000,
): number {
  if (years <= 0 || sigma <= 0) return 0
  const sigmaRootT = sigma * Math.sqrt(years)
  const drift = -sigmaRootT * sigmaRootT / 2  // risk neutral drift (r=0)
  let wins = 0
  for (let i = 0; i < samples; i++) {
    // Box Muller: two uniforms -> one standard normal
    const u1 = Math.random() || 1e-12  // guard against log(0)
    const u2 = Math.random()
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
    // Lognormal price at expiry under risk neutral measure
    const settlement = spot * Math.exp(drift + sigmaRootT * z)
    const payoff = strategy.legs.reduce((sum, l) => sum + legPayoff(l, settlement), 0)
    if (payoff > 0) wins++
  }
  return wins / samples
}
