import { useMemo, useState, useEffect } from 'react'
import type { Oracle } from '../lib/predict-types'
import { useOracles } from '../hooks/useOracles'
import { useOracleState } from '../hooks/useOracleState'
import { OracleSelector } from '../components/OracleSelector'
import { SurfaceChart } from '../components/SurfaceChart'
import { parseRawSvi, smileCurve, impliedVol } from '../lib/svi'
import { formatExpiry } from '../lib/format'

export function Surface() {
  const { data: allOracles } = useOracles()
  const activeOracles = useMemo<Oracle[]>(
    () => (allOracles ?? [])
      .filter((o) => o.status === 'active')
      .sort((a, b) => b.expiry - a.expiry),
    [allOracles],
  )

  const [oracleId, setOracleId] = useState<string | null>(null)
  useEffect(() => {
    if (!oracleId && activeOracles[0]) setOracleId(activeOracles[0].oracle_id)
  }, [oracleId, activeOracles])

  const oracle = activeOracles.find((o) => o.oracle_id === oracleId) ?? null
  const { data: state } = useOracleState(oracleId ?? undefined)

  const spot = state?.latest_price?.spot ? state.latest_price.spot / 1e9 : null
  const forward = state?.latest_price?.forward ? state.latest_price.forward / 1e9 : null
  const sviRaw = state?.latest_svi ?? null

  // Time to expiry in years
  const yearsToExpiry = useMemo(() => {
    if (!oracle) return null
    const msToExpiry = oracle.expiry - Date.now()
    if (msToExpiry <= 0) return null
    return msToExpiry / (1000 * 60 * 60 * 24 * 365.25)
  }, [oracle])

  const curve = useMemo(() => {
    if (!sviRaw || !forward || !yearsToExpiry) return []
    const p = parseRawSvi(sviRaw)
    return smileCurve(p, forward, yearsToExpiry, { widthPct: 0.3 })
  }, [sviRaw, forward, yearsToExpiry])

  // ATM vol - IV at the forward (k = 0)
  const atmVol = useMemo(() => {
    if (!sviRaw || !forward || !yearsToExpiry) return null
    return impliedVol(parseRawSvi(sviRaw), forward, forward, yearsToExpiry)
  }, [sviRaw, forward, yearsToExpiry])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Volatility Surface</h1>
          <p className="text-xs text-zinc-500 mt-1">
            Implied vol smile derived live from the oracle's SVI parameters.
          </p>
        </div>
        <OracleSelector oracles={activeOracles} selectedId={oracleId} onSelect={(o) => setOracleId(o.oracle_id)} />
      </div>

      {!oracle || !spot || !sviRaw ? (
        <div className="text-xs text-zinc-500">Loading oracle state…</div>
      ) : (
        <>
          <Stats
            atmVol={atmVol}
            spot={spot}
            forward={forward}
            timeToExpiry={oracle.expiry}
            sviRaw={sviRaw}
          />
          {curve.length > 0 && spot && forward && (
            <SurfaceChart data={curve} spot={spot} forward={forward} />
          )}
        </>
      )}
    </div>
  )
}

function Stats({
  atmVol, spot, forward, timeToExpiry, sviRaw,
}: {
  atmVol: number | null
  spot: number
  forward: number | null
  timeToExpiry: number
  sviRaw: { a: number; b: number; rho: number; rho_negative: boolean; m: number; m_negative: boolean; sigma: number }
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
      <Stat label="ATM IV" value={atmVol != null ? `${(atmVol * 100).toFixed(1)}%` : '—'} />
      <Stat label="Spot" value={`$${spot.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
      <Stat label="Forward" value={forward != null ? `$${forward.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—'} />
      <Stat label="Expires in" value={formatExpiry(timeToExpiry)} />

      <Stat label="a" value={(sviRaw.a / 1e9).toExponential(2)} mono />
      <Stat label="b" value={(sviRaw.b / 1e9).toExponential(2)} mono />
      <Stat label="ρ (rho)" value={`${sviRaw.rho_negative ? '-' : ''}${(sviRaw.rho / 1e9).toFixed(4)}`} mono />
      <Stat label="σ (sigma)" value={(sviRaw.sigma / 1e9).toFixed(4)} mono />
    </div>
  )
}

function Stat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className={`mt-1 text-lg ${mono ? 'font-mono' : ''} text-zinc-100`}>{value}</div>
    </div>
  )
}
