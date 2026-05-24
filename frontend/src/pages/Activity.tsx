import { useStrategyActivity } from '../hooks/useStrategyActivity'
import { ActivityTable } from '../components/ActivityTable'

export function Activity() {
  const { data: rows, isLoading, error } = useStrategyActivity()

  if (isLoading) return <div className="p-6 text-zinc-500">Loading activity…</div>
  if (error) return <div className="p-6 text-red-400">Failed to load: {error.message}</div>

  const list = rows ?? []
  const byType = list.reduce<Record<string, number>>((acc, r) => {
    acc[r.strategyType] = (acc[r.strategyType] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Strategy Activity</h1>
        <p className="text-xs text-zinc-500 mt-1">
          Live feed of every <code className="text-zinc-300">StrategyExecuted</code> event emitted by our Move contract on Sui testnet · refreshing every 5s
        </p>
      </div>

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
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="mt-1 text-lg font-mono text-zinc-100">{value}</div>
    </div>
  )
}
