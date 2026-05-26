import { useOracles } from '../hooks/useOracles'
import { OracleCard } from '../components/OracleCard'
import { PageHeader } from '../components/PageHeader'

export function Markets() {
  const { data, isLoading, error } = useOracles()

  if (isLoading) return <div className="p-6 text-fg-3">Loading oracles…</div>
  if (error) return <div className="p-6 text-loss">Failed to load: {error.message}</div>

  const active = (data ?? []).filter((o) => o.status === 'active')
  return (
    <div className="p-6 space-y-8">
      <PageHeader
        title="Markets"
        subtitle={`${active.length} active oracle${active.length === 1 ? '' : 's'} on Predict testnet`}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {active.map((o) => (
          <OracleCard key={o.oracle_id} oracle={o} />
        ))}
      </div>
    </div>
  )
}