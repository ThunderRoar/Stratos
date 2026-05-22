import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useCurrentAccount } from '@mysten/dapp-kit-react'
import { usePredictManager } from '../hooks/usePredictManager'
import { usePositions } from '../hooks/usePositions'
import { useExecuteStrategy } from '../hooks/useExecuteStrategy'
import { PositionTable } from '../components/PositionTable'
import { buildRedeemPositionTx } from '../lib/predict-actions'
import type { Position } from '../lib/predict-types'

const fmtDusdc = (raw6: number) =>
  (raw6 / 1e6).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })

export function Portfolio() {
  const account = useCurrentAccount()
  const { managerId, isLoading: mgrLoading } = usePredictManager()
  const { data: positions, isLoading, error } = usePositions(managerId)
  const queryClient = useQueryClient()
  const redeem = useExecuteStrategy()
  const [redeemingKey, setRedeemingKey] = useState<string | null>(null)

  const onRedeem = async (p: Position) => {
    if (!managerId) return
    const key = `${p.oracle_id}-${p.strike}-${p.is_up}`
    setRedeemingKey(key)
    try {
      await redeem.mutateAsync(buildRedeemPositionTx({
        managerId,
        oracleId: p.oracle_id,
        expiry: p.expiry,
        strike: p.strike,
        isUp: p.is_up,
        qtyRaw: p.open_quantity,
      }))
      // Indexer lags the chain so force invalidate so the next poll picks up the new state
      await queryClient.invalidateQueries({ queryKey: ['positions', managerId] })
      await queryClient.invalidateQueries({ queryKey: ['manager-balance', managerId] })
    } finally {
      setRedeemingKey(null)
    }
  }

  if (!account) {
    return <div className="p-6 text-zinc-500">Connect a wallet to view your portfolio.</div>
  }
  if (mgrLoading) {
    return <div className="p-6 text-zinc-500">Checking for your manager…</div>
  }
  if (!managerId) {
    return <div className="p-6 text-zinc-500">No manager found. Execute a strategy on the Builder page first.</div>
  }
  if (isLoading) {
    return <div className="p-6 text-zinc-500">Loading positions…</div>
  }
  if (error) {
    return <div className="p-6 text-red-400">Failed to load positions: {error.message}</div>
  }

  const open = (positions ?? []).filter((p) => p.open_quantity > 0)
  const totalCost = open.reduce((sum, p) => sum + p.open_cost_basis, 0)
  const totalMark = open.reduce((sum, p) => sum + p.mark_value, 0)
  const totalPnl = open.reduce((sum, p) => sum + p.unrealized_pnl, 0)
  const pnlColor = totalPnl > 0 ? 'text-green-400' : totalPnl < 0 ? 'text-red-400' : 'text-zinc-300'
  const pnlSign = totalPnl > 0 ? '+' : ''

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Portfolio</h1>
        <p className="text-xs text-zinc-500 mt-1">
          Live positions from the Predict server · {open.length} open
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
        <Stat label="Open cost basis" value={fmtDusdc(totalCost)} />
        <Stat label="Current mark value" value={fmtDusdc(totalMark)} />
        <Stat label="Unrealized P&L" value={`${pnlSign}${fmtDusdc(totalPnl)}`} valueClass={pnlColor} />
      </div>

      <PositionTable positions={open} onRedeem={onRedeem} redeemingKey={redeemingKey} />
      {redeem.error && (
        <div className="text-xs text-red-400">Redeem failed: {redeem.error.message}</div>
      )}
    </div>
  )
}

function Stat({ label, value, valueClass = 'text-zinc-100' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className={`mt-1 text-lg font-mono ${valueClass}`}>{value}</div>
    </div>
  )
}
