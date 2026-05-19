import { useEffect, useMemo, useState } from 'react'
import type { Leg, Strategy, StrategyTemplate } from '../lib/strategy-types'
import type { Oracle } from '../lib/predict-types'
import { useOracles } from '../hooks/useOracles'
import { useOracleState } from '../hooks/useOracleState'
import { StrategyTemplates } from '../components/StrategyTemplates'
import { PayoffDiagram } from '../components/PayoffDiagram'
import { CostPreview } from '../components/CostPreview'
import { LegEditor } from '../components/LegEditor'
import { OracleSelector } from '../components/OracleSelector'
import { strategyMetrics } from '../lib/payoff'

export function Builder() {
  const { data: allOracles } = useOracles()
  const activeOracles = useMemo<Oracle[]>(
    () => (allOracles ?? []).filter((oracle) => oracle.status === 'active').sort((a, b) => a.expiry - b.expiry),
    [allOracles],
  )

  const [oracleId, setOracleId] = useState<string | null>(null)
  useEffect(() => {
    if (!oracleId && activeOracles[0]) setOracleId(activeOracles[0].oracle_id)
  }, [oracleId, activeOracles])

  const oracle = activeOracles.find((oracle) => oracle.oracle_id === oracleId) ?? null
  const { data: oracleState } = useOracleState(oracleId ?? undefined)
  
  const spot = oracleState?.latest_price?.spot ? oracleState.latest_price.spot / 1e9 : null
  const [template, setTemplate] = useState<StrategyTemplate | null>(null)
  const [legs, setLegs] = useState<Leg[]>([])
  useEffect(() => {
    if (template && spot != null) setLegs(template.buildLegs(spot))
  }, [template, spot])

  const strategy = useMemo<Strategy | null>(
    () => (template && legs.length ? { templateId: template.id, legs } : null),
    [template, legs],
  )

  const metrics = useMemo(
    () => (strategy && spot != null ? strategyMetrics(strategy, spot) : null),
    [strategy, spot],
  )

  const minStrike = oracle ? oracle.min_strike / 1e9 : undefined
  const tickSize = oracle ? oracle.tick_size / 1e9 : undefined

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Strategy Builder</h1>
        <OracleSelector oracles={activeOracles} selectedId={oracleId} onSelect={(o) => setOracleId(o.oracle_id)} />
      </div>

      {spot == null ? (
        <div className="text-xs text-zinc-500">Loading oracle…</div>
      ) : (
        <div className="text-xs text-zinc-500">
          Spot ${spot.toLocaleString(undefined, { maximumFractionDigits: 0 })} · costs are mock until Step 5
        </div>
      )}

      <StrategyTemplates selectedId={template?.id ?? null} onSelect={setTemplate} />

      {strategy && metrics && spot != null && (
        <>
          <PayoffDiagram strategy={strategy} spot={spot} />
          <CostPreview maxProfit={metrics.maxProfit} maxLoss={metrics.maxLoss} netCost={metrics.netCost} />

          <div>
            <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Legs</div>
            <div className="space-y-2">
              {legs.map((leg, i) => (
                <LegEditor
                  key={i}
                  leg={leg}
                  index={i}
                  minStrike={minStrike}
                  tickSize={tickSize}
                  onChange={(next) => setLegs((curr) => curr.map((l, idx) => (idx === i ? next : l)))}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
