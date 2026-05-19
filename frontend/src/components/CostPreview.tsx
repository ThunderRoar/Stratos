type Props = {
  maxProfit: number
  maxLoss: number
  netCost: number
}

export function CostPreview({ maxProfit, maxLoss, netCost }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3 text-sm">
      <Metric label="Max profit" value={maxProfit} positive />
      <Metric label="Max loss"   value={maxLoss} />
      <Metric label="Net cost"   value={netCost} />
    </div>
  )
}

function Metric({ label, value, positive }: { label: string; value: number; positive?: boolean }) {
  const tone = positive ? 'text-green-400' : value < 0 ? 'text-red-400' : 'text-zinc-100'

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className={`mt-1 text-lg font-mono ${tone}`}>
        ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
      </div>
    </div>
  )
}
