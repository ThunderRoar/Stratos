import type { OracleSVI } from './predict-types'

// All SVI params arrive as integers scaled by 1e9 (Sui float_scaling) with sign flags carried separately for rho and m.
export type SviParams = {
  a: number
  b: number
  rho: number // signed
  m: number // signed
  sigma: number
}

export function parseRawSvi(svi: OracleSVI): SviParams {
  const SCALE = 1e9
  return {
    a: svi.a / SCALE,
    b: svi.b / SCALE,
    rho: (svi.rho_negative ? -1 : 1) * (svi.rho / SCALE),
    m: (svi.m_negative ? -1 : 1) * (svi.m / SCALE),
    sigma: svi.sigma / SCALE,
  }
}

// SVI raw parameterization: w(k) = a + b*(rho(k−m) + sqrt((k−m)^2 + sig^2))
export function totalVariance(p: SviParams, k: number): number {
  const dk = k - p.m
  return p.a + p.b * (p.rho * dk + Math.sqrt(dk * dk + p.sigma * p.sigma))
}

// IV(K) = sqrt(w(k) / T). Returns annualized implied vol as a decimal (0.32 = 32%).
export function impliedVol(
  p: SviParams,
  strike: number,
  forward: number,
  yearsToExpiry: number,
): number {
  const k = Math.log(strike / forward)
  const w = totalVariance(p, k)
  // Guard against negative variance from extrapolation past sensible params.
  return Math.sqrt(Math.max(w, 0) / Math.max(yearsToExpiry, 1e-9))
}

// Generate {strike, iv} points across a range, for charting.
export function smileCurve(
  p: SviParams,
  forward: number, // dollars
  yearsToExpiry: number,
  options: { widthPct?: number; steps?: number } = {},
): { strike: number; iv: number }[] {
  const widthPct = options.widthPct ?? 0.3 // +/- 30% strike range around forward
  const steps = options.steps ?? 100

  const lo = forward * (1 - widthPct)
  const hi = forward * (1 + widthPct)
  const stride = (hi - lo) / steps

  const out: { strike: number; iv: number }[] = []
  for (let i = 0; i <= steps; i++) {
    const strike = lo + i * stride
    out.push({ strike, iv: impliedVol(p, strike, forward, yearsToExpiry) })
  }
  return out
}
