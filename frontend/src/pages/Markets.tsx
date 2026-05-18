import { useOracles } from '../hooks/useOracles'
import { OracleCard } from '../components/OracleCard'

export function Markets() {
  const { data, isLoading, error } = useOracles()

  if (isLoading) return <div className="p-6 text-zinc-500">Loading oracles…</div>
  if (error) return <div className="p-6 text-red-400">Failed to load: {error.message}</div>

  const active = (data ?? []).filter((o) => o.status === 'active')
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Markets</h1>
      <div className="text-xs text-zinc-500 mb-4">{active.length} active</div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {active.map((o) => (
          <OracleCard key={o.oracle_id} oracle={o} />
        ))}
      </div>
    </div>
  )
}
