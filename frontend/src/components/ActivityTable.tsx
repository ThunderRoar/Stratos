import type { StrategyActivityRow } from '../hooks/useStrategyActivity'
import { StatusLabel } from './StatusLabel'

type Variant = 'up' | 'down' | 'analytical' | 'pending' | 'neutral'

const STRATEGY_VARIANT: Record<string, Variant> = {
  bull_ladder: 'up',
  bear_ladder: 'down',
  strangle: 'analytical',
  range_bet: 'pending',
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
    return <div className="text-xs text-fg-3">No strategies executed yet — be the first.</div>
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-line/60 bg-surface">
      <table className="w-full text-sm">
        <thead className="bg-bg/40 text-[10px] uppercase tracking-wider text-fg-3">
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
            <tr key={r.txDigest} className="border-t border-line hover:bg-surface-elev/50">
              <td className="px-3 py-2 text-fg-2">{fmtTime(r.timestampMs)}</td>
              <td className="px-3 py-2">
                <StatusLabel variant={STRATEGY_VARIANT[r.strategyType] ?? 'neutral'}>
                  {STRATEGY_LABEL[r.strategyType] ?? r.strategyType}
                </StatusLabel>
              </td>
              <td className="px-3 py-2 font-mono text-xs">
                <a href={`https://suiscan.xyz/testnet/object/${r.oracle}`} target="_blank" rel="noopener noreferrer" className="hover:text-fg">
                  {truncate(r.oracle)}
                </a>
              </td>
              <td className="px-3 py-2 text-right font-mono">{r.legCount}</td>
              <td className="px-3 py-2 font-mono text-xs">
                <a href={`https://suiscan.xyz/testnet/account/${r.sender}`} target="_blank" rel="noopener noreferrer" className="hover:text-fg">
                  {truncate(r.sender)}
                </a>
              </td>
              <td className="px-3 py-2 font-mono text-xs">
                <a href={`https://suiscan.xyz/testnet/tx/${r.txDigest}`} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent/80 underline underline-offset-2">
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