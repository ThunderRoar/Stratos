import { useMemo, useState } from 'react'
import type { Strategy, StrategyTemplate } from '../lib/strategy-types'
import { StrategyTemplates } from '../components/StrategyTemplates'
import { PayoffDiagram } from '../components/PayoffDiagram'
import { strategyMetrics } from '../lib/payoff'

const MOCK_SPOT = 77000

export function Builder() {
  const [template, setTemplate] = useState<StrategyTemplate | null>(null)

  const strategy = useMemo<Strategy | null>(() => (
    template ? { templateId: template.id, legs: template.buildLegs(MOCK_SPOT) } : null),
    [template]
  )

  const metrics = useMemo(() => (
    strategy ? strategyMetrics(strategy, MOCK_SPOT) : null),
    [strategy]
  )

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Strategy Builder</h1>
        <p className="text-xs text-zinc-500">
          Mock spot ${MOCK_SPOT.toLocaleString()}. Real oracle wiring comes in Step 4.
        </p>
      </div>

      <StrategyTemplates selectedId={template?.id ?? null} onSelect={setTemplate} />

      {strategy && metrics && (
        <>
          <PayoffDiagram strategy={strategy} spot={MOCK_SPOT} />
          <div className="grid grid-cols-3 gap-3 text-sm">
            <Metric label="Max profit" value={metrics.maxProfit} positive />
            <Metric label="Max loss" value={metrics.maxLoss} />
            <Metric label="Net cost" value={metrics.netCost} />
          </div>

          <div>
            <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Legs</div>
            <div className="space-y-1 text-sm font-mono">
              {strategy.legs.map((l, i) => (
                <div key={i} className="text-zinc-300">
                  {l.side} {l.kind === 'binary'
                    ? `${l.direction.toUpperCase()} @ $${l.strike.toLocaleString()}`
                    : `RANGE $${l.lower.toLocaleString()}–$${l.higher.toLocaleString()}`} · qty {l.qty} · cost ${l.cost}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function Metric({ label, value, positive }: { label: string; value: number; positive?: boolean }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className={`mt-1 text-lg font-mono ${positive ? 'text-green-400' : value < 0 ? 'text-red-400' : 'text-zinc-100'}`}>
        ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
      </div>
    </div>
  )
}
