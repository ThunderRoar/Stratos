import {
  Area,
  CartesianGrid,
  ComposedChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Strategy } from '../lib/strategy-types'
import { payoffCurve } from '../lib/payoff'
import { formatUsd } from '../lib/format'

const usd = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

export function PayoffDiagram({ strategy, spot }: { strategy: Strategy; spot: number }) {
  const data = payoffCurve(strategy, spot)

  return (
    <div className="h-72 w-full rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
          <defs>
            <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#22c55e" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
          <XAxis
            dataKey="settlement"
            tickFormatter={usd}
            stroke="#71717a"
            fontSize={11}
          />
          <YAxis tickFormatter={usd} stroke="#71717a" fontSize={11} />
          <Tooltip
            contentStyle={{ background: '#18181b', border: '1px solid #3f3f46' }}
            labelFormatter={(v: number) => `Settlement: ${usd(v)}`}
            formatter={(v: number) => [usd(v), 'P&L']}
          />

          <ReferenceLine y={0} stroke="#52525b" />
          <ReferenceLine x={spot} stroke="#3b82f6" label={{ value: 'spot', fill: '#3b82f6', position: 'insideTopRight', fontSize: 10 }} />

          <Area
            type="monotone"
            dataKey="payoff"
            stroke="#22c55e"
            fill="url(#profitGradient)"
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
