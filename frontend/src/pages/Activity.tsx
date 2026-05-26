import { useStrategyActivity } from '../hooks/useStrategyActivity'
import { ActivityTable } from '../components/ActivityTable'
import { PageHeader } from '../components/PageHeader'

export function Activity() {
  const { data: rows, isLoading, error } = useStrategyActivity()

  if (isLoading) return <div className="p-6 text-fg-3">Loading activity…</div>
  if (error) return <div className="p-6 text-loss">Failed to load: {error.message}</div>

  const list = rows ?? []
  const byType = list.reduce<Record<string, number>>((acc, r) => {
    acc[r.strategyType] = (acc[r.strategyType] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="p-6 space-y-8">
      <PageHeader
        title="Strategy Activity"
        subtitle="Live feed of every StrategyExecuted event from our Move contract · refreshing every 5s"
      />

      {list.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
          <Stat label="Total" value={list.length.toString()} />
          <Stat label="Bull Ladder" value={(byType.bull_ladder ?? 0).toString()} />
          <Stat label="Bear Ladder" value={(byType.bear_ladder ?? 0).toString()} />
          <Stat label="Strangle" value={(byType.strangle ?? 0).toString()} />
          <Stat label="Range Bet" value={(byType.range_bet ?? 0).toString()} />
        </div>
      )}

      <ActivityTable rows={list} />
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line/60 bg-surface p-4">
      <div className="text-[10px] uppercase tracking-wider text-fg-3 font-medium">{label}</div>
      <div className="mt-1.5 text-xl font-mono text-fg">{value}</div>
    </div>
  )
}