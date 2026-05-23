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
//   the +=1 sigma dollar move (e.g. 1810 means [-1810, +1810] is the 68% band)
export function expectedMoveDollars(spot: number, atmVol: number, years: number): number {
  return spot * atmVol * Math.sqrt(years)
}
