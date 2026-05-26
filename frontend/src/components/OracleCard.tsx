import type { Oracle } from '../lib/predict-types'
import { useOracleState } from '../hooks/useOracleState'
import { formatUsd, formatExpiry } from '../lib/format'
import { parseRawSvi, impliedVol } from '../lib/svi'
import { expectedMoveDollars, yearsFromDays } from '../lib/options-math'
import { StatusLabel } from './StatusLabel'

const STATUS_VARIANT = {
  active: 'active',
  pending_settlement: 'pending',
  settled: 'settled',
  inactive: 'neutral',
} as const

const HORIZONS = [
  { label: '1d', years: yearsFromDays(1) },
  { label: '7d', years: yearsFromDays(7) },
  { label: '30d', years: yearsFromDays(30) },
]

const fmtMoveUsd = (n: number) => '\u00B1' + n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }) // \u00B1 is plus minus unicode

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
    <div className="group rounded-2xl border border-line/60 bg-surface p-6 transition hover:border-accent/30 hover:bg-surface-elev/60">
      <div className="flex items-center justify-between">
        <span className="text-base font-semibold text-fg-2">{oracle.underlying_asset}</span>
        <StatusLabel variant={STATUS_VARIANT[oracle.status] ?? 'neutral'}>
          {oracle.status.replace('_', ' ')}
        </StatusLabel>
      </div>
      <div className="mt-4 text-4xl font-semibold tracking-tight text-fg">
        {spot ? formatUsd(spot) : '—'}
      </div>
      <div className="mt-2 text-sm text-fg-3">
        expires in {formatExpiry(oracle.expiry)}
      </div>
      {expectedMoves && (
        <div className="mt-5 pt-4 border-t border-line/60">
          <div className="text-[11px] uppercase tracking-wider text-fg-3 mb-2">Expected move</div>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
            {expectedMoves.map((m) => (
              <div key={m.label} className="flex flex-col">
                <span className="text-fg font-medium">{fmtMoveUsd(m.move)}</span>
                <span className="text-[11px] text-fg-3">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
