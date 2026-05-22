import type { Position } from '../lib/predict-types'
import { formatExpiry } from '../lib/format'

type Props = {
  positions: Position[]
  onRedeem?: (p: Position) => void
  redeemingKey?: string | null // `${oracle}-${strike}-${isUp}` for the row in flight
}


const fmtStrike = (raw9: number) => (raw9 / 1e9).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const fmtDusdc = (raw6: number) => (raw6 / 1e6).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
const fmtQty = (raw6: number) => (raw6 / 1e6).toLocaleString('en-US', { maximumFractionDigits: 2 })

const STATUS_COLOR: Record<Position['status'], string> = {
  active: 'bg-blue-500/15 text-blue-300',
  pending_settlement: 'bg-amber-500/15 text-amber-300',
  settled: 'bg-zinc-500/15 text-zinc-300',
}

export function PositionTable({ positions, onRedeem, redeemingKey }: Props) {
  if (positions.length === 0) {
    return <div className="text-xs text-zinc-500">No positions yet — execute a strategy to see it here.</div>
  }
  const rowKey = (p: Position) => `${p.oracle_id}-${p.strike}-${p.is_up}`

  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-800">
      <table className="w-full text-sm">
        <thead className="bg-zinc-900 text-xs uppercase tracking-wider text-zinc-500">
          <tr>
            <Th>Underlying</Th>
            <Th>Direction</Th>
            <Th>Strike</Th>
            <Th>Qty</Th>
            <Th>Cost</Th>
            <Th>Mark</Th>
            <Th>Unrealized P&L</Th>
            <Th>Expires</Th>
            <Th>Status</Th>
            <Th></Th>
          </tr>
        </thead>
        <tbody>
          {positions.map((p) => {
            const pnl = p.unrealized_pnl
            const pnlColor = pnl > 0 ? 'text-green-400' : pnl < 0 ? 'text-red-400' : 'text-zinc-400'
            const sign = pnl > 0 ? '+' : ''
            return (
              <tr key={`${p.oracle_id}-${p.strike}-${p.is_up}`} className="border-t border-zinc-800 hover:bg-zinc-900/50">
                <Td>{p.underlying_asset}</Td>
                <Td>
                  <span className={p.is_up ? 'text-green-400' : 'text-red-400'}>
                    {p.is_up ? 'UP' : 'DOWN'}
                  </span>
                </Td>
                <Td className="font-mono">{fmtStrike(p.strike)}</Td>
                <Td className="font-mono">{fmtQty(p.open_quantity)}</Td>
                <Td className="font-mono">{fmtDusdc(p.open_cost_basis)}</Td>
                <Td className="font-mono">{fmtDusdc(p.mark_value)}</Td>
                <Td className={`font-mono ${pnlColor}`}>{sign}{fmtDusdc(pnl)}</Td>
                <Td className="text-zinc-400">{formatExpiry(p.expiry)}</Td>
                <Td>
                  <span className={`rounded px-2 py-0.5 text-xs ${STATUS_COLOR[p.status]}`}>
                    {p.status.replace('_', ' ')}
                  </span>
                </Td>
                <Td>
                  {onRedeem && p.open_quantity > 0 && p.status !== 'pending_settlement' && (
                    <button
                      onClick={() => onRedeem(p)}
                      disabled={redeemingKey != null}
                      className="rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 px-2 py-1 text-xs"
                    >
                      {redeemingKey === rowKey(p) ? 'Redeeming…' : 'Redeem'}
                    </button>
                  )}
                </Td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 text-left font-medium">{children}</th>
}

function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2 ${className}`}>{children}</td>
}