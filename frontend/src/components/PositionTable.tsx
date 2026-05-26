import type { Position } from '../lib/predict-types'
import { formatExpiry } from '../lib/format'
import { StatusLabel } from './StatusLabel'

type Props = {
  positions: Position[]
  onRedeem?: (p: Position) => void
  redeemingKey?: string | null // `${oracle}-${strike}-${isUp}` for the row in flight
}

const fmtStrike = (raw9: number) => (raw9 / 1e9).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const fmtDusdc = (raw6: number) => (raw6 / 1e6).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
const fmtQty = (raw6: number) => (raw6 / 1e6).toLocaleString('en-US', { maximumFractionDigits: 2 })

const STATUS_VARIANT: Record<Position['status'], 'active' | 'pending' | 'settled'> = {
  active: 'active',
  pending_settlement: 'pending',
  settled: 'settled',
}

export function PositionTable({ positions, onRedeem, redeemingKey }: Props) {
  if (positions.length === 0) {
    return <div className="text-xs text-fg-3">No positions yet — execute a strategy to see it here.</div>
  }
  const rowKey = (p: Position) => `${p.oracle_id}-${p.strike}-${p.is_up}`

  return (
    <div className="overflow-x-auto rounded-lg border border-line/60 bg-surface">
      <table className="w-full text-sm">
        <thead className="bg-bg/40 text-[10px] uppercase tracking-wider text-fg-3">
          <tr>
            <Th>Underlying</Th>
            <Th>Direction</Th>
            <Th align="right">Strike</Th>
            <Th align="right">Qty</Th>
            <Th align="right">Cost</Th>
            <Th align="right">Mark</Th>
            <Th align="right">Unrealized P&L</Th>
            <Th align="right">Expires</Th>
            <Th>Status</Th>
            <Th></Th>
          </tr>
        </thead>
        <tbody>
          {positions.map((p) => {
            const pnl = p.unrealized_pnl
            const pnlColor = pnl > 0 ? 'text-profit' : pnl < 0 ? 'text-loss' : 'text-fg-2'
            const sign = pnl > 0 ? '+' : ''
            return (
              <tr key={`${p.oracle_id}-${p.strike}-${p.is_up}`} className="border-t border-line hover:bg-surface-elev/50">
                <Td>{p.underlying_asset}</Td>
                <Td>
                  <StatusLabel variant={p.is_up ? 'up' : 'down'}>{p.is_up ? 'UP' : 'DOWN'}</StatusLabel>
                </Td>
                <Td className="font-mono text-right">{fmtStrike(p.strike)}</Td>
                <Td className="font-mono text-right">{fmtQty(p.open_quantity)}</Td>
                <Td className="font-mono text-right">{fmtDusdc(p.open_cost_basis)}</Td>
                <Td className="font-mono text-right">{fmtDusdc(p.mark_value)}</Td>
                <Td className={`font-mono text-right ${pnlColor}`}>{sign}{fmtDusdc(pnl)}</Td>
                <Td className="text-fg-2 text-right">{formatExpiry(p.expiry)}</Td>
                <Td>
                  <StatusLabel variant={STATUS_VARIANT[p.status] ?? 'neutral'}>
                    {p.status.replace('_', ' ')}
                  </StatusLabel>
                </Td>
                <Td>
                  {onRedeem && p.open_quantity > 0 && p.status !== 'pending_settlement' && (
                    <button
                      onClick={() => onRedeem(p)}
                      disabled={redeemingKey != null}
                      className="rounded bg-surface-elev hover:bg-line disabled:opacity-50 px-2 py-1 text-xs"
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

function Th({ children, align = 'left' }: { children?: React.ReactNode; align?: 'left' | 'right' }) {
  return <th className={`px-3 py-2 font-medium ${align === 'right' ? 'text-right' : 'text-left'}`}>{children}</th>
}

function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2 ${className}`}>{children}</td>
}