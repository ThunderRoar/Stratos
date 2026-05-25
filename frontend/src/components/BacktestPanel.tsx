import { useState } from 'react'
import { useBacktest } from '../hooks/useBacktest'
import { BacktestChart } from './BacktestChart'
import type { Strategy } from '../lib/strategy-types'

type Props = {
  strategy: Strategy
  oracleId: string
  oracleExpiryMs: number
}

const WINDOWS = [
  { label: '15m', ms: 15 * 60_000 },
  { label: '30m', ms: 30 * 60_000 },
  { label: '1h', ms: 60 * 60_000 },
  { label: '3h', ms: 3 * 60 * 60_000 }
]

const fmtUsd = (n: number) => '$' + Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 2 })
const fmtSignedUsd = (n: number) => (n >= 0 ? '+' : '-') + fmtUsd(n)
const fmtSignedPct = (n: number) => `${n >= 0 ? '+' : ''}${(n * 100).toFixed(2)}%`

const fmtAgo = (ms: number) => {
  const min = ms / 60_000
  if (min < 60) return `${min.toFixed(0)}m ago`
  return `${(min / 60).toFixed(0)}h ago`
}

const fmtWindow = (ms: number) => {
  const min = ms / 60_000
  if (min < 60) return `${min.toFixed(0)} minute${min === 1 ? '' : 's'}`
  const hr = min / 60
  return `${hr.toFixed(0)} hour${hr === 1 ? '' : 's'}`
}

export function BacktestPanel({ strategy, oracleId, oracleExpiryMs }: Props) {
  const [windowMs, setWindowMs] = useState(WINDOWS[1].ms)
  const { data, isLoading } = useBacktest(oracleId, strategy, oracleExpiryMs, windowMs)
  const entry = data[0]
  const last = data[data.length - 1]
  const entryValue = entry?.value ?? 0
  const currentValue = last?.value ?? 0
  const pnl = last?.pnl ?? 0
  const pnlPct = last?.pnlPct ?? 0
  const pnlColor = pnl > 0 ? 'text-green-400' : pnl < 0 ? 'text-red-400' : 'text-zinc-300'

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-xs uppercase tracking-wider text-zinc-500">Backtest</div>
        <div className="flex gap-1 text-xs">
          {WINDOWS.map((w) => (
            <button
              key={w.label}
              onClick={() => setWindowMs(w.ms)}
              className={`rounded px-2 py-1 font-mono ${
                windowMs === w.ms
                  ? 'bg-zinc-700 text-zinc-100'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <Stat label="Entry value" value={fmtUsd(entryValue)} hint={fmtAgo(windowMs)} />
        <Stat label="Current value" value={fmtUsd(currentValue)} hint="now" />
        <Stat label="P&L" value={fmtSignedUsd(pnl)} valueClass={pnlColor} />
        <Stat label="Return" value={fmtSignedPct(pnlPct)} valueClass={pnlColor} />
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center text-xs text-zinc-500 rounded-lg border border-zinc-800 bg-zinc-950">
          Loading historical data…
        </div>
      ) : (
        <BacktestChart data={data} />
      )}

      <div className="text-xs text-zinc-600">
        Hypothetical: if this strategy had been minted {fmtWindow(windowMs)} ago at the prevailing fair price, the line shows how its mark value would have evolved since.
      </div>
    </div>
  )
}

function Stat({label, value, hint, valueClass = 'text-zinc-100'}: {
  label: string
  value: string
  hint?: string
  valueClass?: string
}) {
  return (
    <div>
      <div className="text-xs text-zinc-500">{label}</div>
      <div className={`mt-1 text-base font-mono ${valueClass}`}>{value}</div>
      {hint && <div className="text-[10px] text-zinc-600">{hint}</div>}
    </div>
  )
}
