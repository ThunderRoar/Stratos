import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useCurrentAccount } from '@mysten/dapp-kit-react'
import { usePredictManager } from '../hooks/usePredictManager'
import { usePositions } from '../hooks/usePositions'
import { useExecuteStrategy } from '../hooks/useExecuteStrategy'
import { PositionTable } from '../components/PositionTable'
import { buildRedeemPositionTx } from '../lib/predict-actions'
import { translateError } from '../lib/error-translate'
import type { Position } from '../lib/predict-types'
import { PageHeader } from '../components/PageHeader'

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
    return <div className="p-6 text-fg-3">Connect a wallet to view your portfolio.</div>
  }
  if (mgrLoading) {
    return <div className="p-6 text-fg-3">Checking for your manager…</div>
  }
  if (!managerId) {
    return <div className="p-6 text-fg-3">No manager found. Execute a strategy on the Builder page first.</div>
  }
  if (isLoading) {
    return <div className="p-6 text-fg-3">Loading positions…</div>
  }
  if (error) {
    return <div className="p-6 text-loss">Failed to load positions: {error.message}</div>
  }

  const open = (positions ?? []).filter((p) => p.open_quantity > 0)
  const totalCost = open.reduce((sum, p) => sum + p.open_cost_basis, 0)
  const totalMark = open.reduce((sum, p) => sum + p.mark_value, 0)
  const totalPnl = open.reduce((sum, p) => sum + p.unrealized_pnl, 0)
  const pnlColor = totalPnl > 0 ? 'text-profit' : totalPnl < 0 ? 'text-loss' : 'text-fg'
  const pnlSign = totalPnl > 0 ? '+' : ''

  return (
    <div className="p-6 space-y-8">
      <PageHeader
        title="Portfolio"
        subtitle={`Live positions from the Predict server · ${open.length} open`}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
        <Stat label="Open cost basis" value={fmtDusdc(totalCost)} />
        <Stat label="Current mark value" value={fmtDusdc(totalMark)} />
        <Stat label="Unrealized P&L" value={`${pnlSign}${fmtDusdc(totalPnl)}`} valueClass={pnlColor} />
      </div>

      <PositionTable positions={open} onRedeem={onRedeem} redeemingKey={redeemingKey} />
      {redeem.error && (
        <div className="text-xs text-loss">Redeem failed: {translateError(redeem.error.message)}</div>
      )}
    </div>
  )
}

function Stat({ label, value, valueClass = 'text-fg' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="rounded-lg border border-line/60 bg-surface p-4">
      <div className="text-[10px] uppercase tracking-wider text-fg-3 font-medium">{label}</div>
      <div className={`mt-1.5 text-xl font-mono ${valueClass}`}>{value}</div>
    </div>
  )
}
