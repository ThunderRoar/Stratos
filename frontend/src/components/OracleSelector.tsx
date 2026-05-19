import type { Oracle } from '../lib/predict-types'
import { formatExpiry } from '../lib/format'

type Props = {
  oracles: Oracle[]
  selectedId: string | null
  onSelect: (oracle: Oracle) => void
}

export function OracleSelector({ oracles, selectedId, onSelect }: Props) {
  if (oracles.length === 0) {
    return <div className="text-xs text-zinc-500">No active oracles available.</div>
  }
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs uppercase tracking-wider text-zinc-500">Oracle</label>
      <select
        value={selectedId ?? ''}
        onChange={(e) => {
          const oracle = oracles.find((x) => x.oracle_id === e.target.value)
          if (oracle) onSelect(oracle)
        }}
        className="bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-sm focus:border-blue-500 outline-none"
      >
        {oracles.map((oracle) => (
          <option key={oracle.oracle_id} value={oracle.oracle_id}>
            {oracle.underlying_asset} · expires in {formatExpiry(oracle.expiry)}
          </option>
        ))}
      </select>
    </div>
  )
}
