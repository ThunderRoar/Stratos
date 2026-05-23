import type { Oracle } from '../lib/predict-types'
import { useOracleState } from '../hooks/useOracleState'
import { formatUsd, formatExpiry } from '../lib/format'
import { parseRawSvi, impliedVol } from '../lib/svi'
import { expectedMoveDollars, yearsFromDays } from '../lib/options-math'

const HORIZONS = [
  { label: '1d', years: yearsFromDays(1) },
  { label: '7d', years: yearsFromDays(7) },
  { label: '30d', years: yearsFromDays(30) },
]

const fmtMoveUsd = (n: number) => '±' + n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

export function OracleCard({ oracle }: { oracle: Oracle }) {
  const { data: state } = useOracleState(oracle.oracle_id)
  const spot = state?.latest_price?.spot
  const forward = state?.latest_price?.forward
  const sviRaw = state?.latest_svi

  // ATM IV = vol at the forward strike
  const expectedMoves = (() => {
    if (!spot || !forward || !sviRaw) return null
    const p = parseRawSvi(sviRaw)
    const spotDollars = spot / 1e9
    const forwardDollars = forward / 1e9
    // For "what's the market's view of forward IV", we need a non-zero T just to get IV so
    // Using 1 day as the reference horizon gives ATM IV regardless of oracle's own T
    const atmIv = impliedVol(p, forwardDollars, forwardDollars, yearsFromDays(1))
    return HORIZONS.map((h) => ({
      label: h.label,
      move: expectedMoveDollars(spotDollars, atmIv, h.years),
    }))
  })()

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-baseline justify-between">
        <span className="text-lg font-semibold">{oracle.underlying_asset}</span>
        <span className="text-xs uppercase tracking-wider text-zinc-500">{oracle.status}</span>
      </div>
      <div className="mt-2 text-3xl font-mono">
        {spot ? formatUsd(spot) : '—'}
      </div>
      <div className="mt-2 text-xs text-zinc-500">
        expires in {formatExpiry(oracle.expiry)}
      </div>
      {expectedMoves && (
        <div className="mt-3 text-xs text-zinc-400">
          Expected move:{' '}
          {expectedMoves.map((m, i) => (
            <span key={m.label}>
              {i > 0 && ' · '}
              <span className="font-mono text-zinc-200">{fmtMoveUsd(m.move)}</span>
              <span className="text-zinc-500"> ({m.label})</span>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
