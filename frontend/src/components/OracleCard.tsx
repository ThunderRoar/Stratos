import type { Oracle } from '../lib/predict-types'
import { useOracleState } from '../hooks/useOracleState'
import { formatUsd, formatExpiry } from '../lib/format'

export function OracleCard({ oracle }: { oracle: Oracle }) {
  const { data: state } = useOracleState(oracle.oracle_id)
  const spot = state?.latest_price?.spot

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
    </div>
  )
}
