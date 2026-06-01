import {
  CartesianGrid,
  Line,
  ComposedChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { EquityPoint } from '../lib/backtest'

type Props = {
  data: EquityPoint[]
}

const fmtPnl = (n: number) => (n >= 0 ? '+' : '-') + '$' + Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 2 })

const fmtTime = (ms: number) => {
  const d = new Date(ms)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const fmtTimeFull = (ms: number) => new Date(ms).toLocaleString()

export function BacktestChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-zinc-500 rounded-lg border border-zinc-800 bg-zinc-900">
        No backtest data — pick an oracle with history coverage.
      </div>
    )
  }

  const maxAbs = Math.max(...data.map((d) => Math.abs(d.pnl)))
  const yDomain: [number, number] = [-maxAbs * 1.1, maxAbs * 1.1]

  return (
    <div className="h-64 w-full rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
          <defs>
            <linearGradient id="pnlPositive" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
          <XAxis
            dataKey="timestampMs"
            type="number"
            domain={['dataMin', 'dataMax']}
            tickFormatter={fmtTime}
            stroke="#71717a"
            fontSize={11}
          />
          <YAxis
            tickFormatter={fmtPnl}
            domain={yDomain}
            stroke="#71717a"
            fontSize={11}
          />

          <Tooltip
            contentStyle={{ background: '#18181b', border: '1px solid #3f3f46' }}
            labelFormatter={(v: number) => fmtTimeFull(v)}
            formatter={(value: number, name: string) => {
              if (name === 'pnl') return [fmtPnl(value), 'P&L']
              return [value, name]
            }}
          />

          <ReferenceLine y={0} stroke="#71717a" strokeDasharray="3 3" label={{ value: 'breakeven', fill: '#71717a', fontSize: 10, position: 'insideTopRight' }} />

          <Line
            type="monotone"
            dataKey="pnl"
            stroke="#a855f7"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
