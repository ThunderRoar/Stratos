import type { StrategyActivityRow } from '../hooks/useStrategyActivity'

const STRATEGY_COLOR: Record<string, string> = {
  bull_ladder: 'bg-green-500/15 text-green-300',
  bear_ladder: 'bg-red-500/15 text-red-300',
  strangle: 'bg-purple-500/15 text-purple-300',
  range_bet: 'bg-amber-500/15 text-amber-300',
}

const STRATEGY_LABEL: Record<string, string> = {
  bull_ladder: 'Bull Ladder',
  bear_ladder: 'Bear Ladder',
  strangle: 'Strangle',
  range_bet: 'Range Bet',
}

const truncate = (s: string, n = 6) => `${s.slice(0, n)}…${s.slice(-4)}`

const fmtTime = (ms: number) => {
  const diff = Date.now() - ms
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return new Date(ms).toLocaleDateString()
}

export function ActivityTable({ rows }: { rows: StrategyActivityRow[] }) {
  if (rows.length === 0) {
    return <div className="text-xs text-zinc-500">No strategies executed yet — be the first.</div>
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-800">
      <table className="w-full text-sm">
        <thead className="bg-zinc-900 text-xs uppercase tracking-wider text-zinc-500">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Time</th>
            <th className="px-3 py-2 text-left font-medium">Strategy</th>
            <th className="px-3 py-2 text-left font-medium">Oracle</th>
            <th className="px-3 py-2 text-right font-medium">Legs</th>
            <th className="px-3 py-2 text-left font-medium">Sender</th>
            <th className="px-3 py-2 text-left font-medium">Tx</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.txDigest} className="border-t border-zinc-800 hover:bg-zinc-900/50">
              <td className="px-3 py-2 text-zinc-400">{fmtTime(r.timestampMs)}</td>
              <td className="px-3 py-2">
                <span className={`rounded px-2 py-0.5 text-xs ${STRATEGY_COLOR[r.strategyType] ?? 'bg-zinc-500/15 text-zinc-300'}`}>
                  {STRATEGY_LABEL[r.strategyType] ?? r.strategyType}
                </span>
              </td>
              <td className="px-3 py-2 font-mono text-xs">
                <a href={`https://suiscan.xyz/testnet/object/${r.oracle}`} target="_blank" rel="noopener noreferrer" className="hover:text-zinc-100">
                  {truncate(r.oracle)}
                </a>
              </td>
              <td className="px-3 py-2 text-right font-mono">{r.legCount}</td>
              <td className="px-3 py-2 font-mono text-xs">
                <a href={`https://suiscan.xyz/testnet/account/${r.sender}`} target="_blank" rel="noopener noreferrer" className="hover:text-zinc-100">
                  {truncate(r.sender)}
                </a>
              </td>
              <td className="px-3 py-2 font-mono text-xs">
                <a href={`https://suiscan.xyz/testnet/tx/${r.txDigest}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">
                  {truncate(r.txDigest)} ↗
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
