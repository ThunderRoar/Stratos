import { useEffect, useMemo, useState, useRef } from 'react'
import type { Leg, Strategy, StrategyTemplate } from '../lib/strategy-types'
import type { Oracle } from '../lib/predict-types'
import { useOracles } from '../hooks/useOracles'
import { useOracleState } from '../hooks/useOracleState'
import { StrategyTemplates } from '../components/StrategyTemplates'
import { PayoffDiagram } from '../components/PayoffDiagram'
import { LegEditor } from '../components/LegEditor'
import { OracleSelector } from '../components/OracleSelector'
import { strategyMetrics } from '../lib/payoff'
import { useLegQuotes } from '../hooks/useLegQuote'
import { ExecuteFlow } from '../components/ExecuteFlow'
import { RiskPanel } from '../components/RiskPanel'
import { parseRawSvi, impliedVol } from '../lib/svi'
import { yearsToExpiryFromMs, yearsFromDays } from '../lib/options-math'

export function Builder() {
  const { data: allOracles } = useOracles()
  const activeOracles = useMemo<Oracle[]>(
    () => (allOracles ?? []).filter((oracle) => oracle.status === 'active').sort((a, b) => b.expiry - a.expiry),
    [allOracles],
  )

  const [oracleId, setOracleId] = useState<string | null>(null)
  useEffect(() => {
    if (!oracleId && activeOracles[0]) setOracleId(activeOracles[0].oracle_id)
  }, [oracleId, activeOracles])

  const oracle = activeOracles.find((oracle) => oracle.oracle_id === oracleId) ?? null
  const { data: oracleState } = useOracleState(oracleId ?? undefined)
  const yearsToExpiry = useMemo(() => oracle ? yearsToExpiryFromMs(oracle.expiry) : 0, [oracle])
  
  const spot = oracleState?.latest_price?.spot ? oracleState.latest_price.spot / 1e9 : null
  const [template, setTemplate] = useState<StrategyTemplate | null>(null)
  const [legs, setLegs] = useState<Leg[]>([])
  const quotes = useLegQuotes(legs, oracle)

  const quotedLegs = useMemo<Leg[]>(
    () => legs.map((l, i) => {
      const q = quotes[i]?.data
      if (!q) return l
      // Convert raw DUSDC (6 decimals) back to dollars for calculation
      return { ...l, cost: Number(q.cost) / 1e6 }
    }),
    [legs, quotes],
  )

  const strategy = useMemo<Strategy | null>(
    () => (template && quotedLegs.length ? { templateId: template.id, legs: quotedLegs } : null),
    [template, quotedLegs],
  )

  const seededFor = useRef<string>('')
  useEffect(() => {
    if (!template || spot == null) return
    const key = `${template.id}::${oracleId ?? ''}`
    if (seededFor.current === key) return
    setLegs(template.buildLegs(spot, yearsToExpiry))
    seededFor.current = key
  }, [template, oracleId, spot, yearsToExpiry])

  const metrics = useMemo(
    () => (strategy && spot != null ? strategyMetrics(strategy, spot) : null),
    [strategy, spot],
  )

  const minStrike = oracle ? oracle.min_strike / 1e9 : undefined
  const tickSize = oracle ? oracle.tick_size / 1e9 : undefined

  const atmIv = useMemo(() => {
    if (!oracleState?.latest_svi || !oracleState.latest_price?.forward) return null
    const p = parseRawSvi(oracleState.latest_svi)
    const fwd = oracleState.latest_price.forward / 1e9
    return impliedVol(p, fwd, fwd, yearsFromDays(1))
  }, [oracleState])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Strategy Builder</h1>
        <OracleSelector oracles={activeOracles} selectedId={oracleId} onSelect={(oracle) => setOracleId(oracle.oracle_id)} />
      </div>

      {spot == null ? (
        <div className="text-xs text-zinc-500">Loading oracle…</div>
      ) : (
        <div className="text-xs text-zinc-500">
          Spot ${spot.toLocaleString(undefined, { maximumFractionDigits: 0 })} · live costs from chain
        </div>
      )}

      <StrategyTemplates selectedId={template?.id ?? null} onSelect={setTemplate} />

      {strategy && metrics && spot != null && (
        <>
          <PayoffDiagram strategy={strategy} spot={spot} />
          {strategy && spot != null && atmIv != null && yearsToExpiry != null && (
            <RiskPanel strategy={strategy} spot={spot} atmIv={atmIv} years={yearsToExpiry} />
          )}

          <div>
            <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Legs</div>
            <div className="space-y-2">
              {quotedLegs.map((leg, i) => (
                <LegEditor
                  key={i}
                  leg={leg}
                  index={i}
                  minStrike={minStrike}
                  tickSize={tickSize}
                  quoting={quotes[i]?.isFetching ?? false}
                  quoteError={quotes[i]?.error?.message ?? null}
                  onChange={(next) => setLegs((curr) => curr.map((l, idx) => (idx === i ? { ...next, cost: l.cost } : l)))}
                />
              ))}
            </div>
          </div>
        </>
      )}
      <ExecuteFlow
        strategy={strategy}
        oracleId={oracleId}
        expiry={oracle?.expiry ?? null}
      />
    </div>
  )
}
