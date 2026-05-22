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

type Point = { strike: number; iv: number }

type Props = {
  data: Point[]
  spot: number
  forward: number
}

const fmtUsd = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`

export function SurfaceChart({ data, spot, forward }: Props) {
  return (
    <div className="h-80 w-full rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
          <defs>
            <linearGradient id="ivFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a855f7" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
          <XAxis
            dataKey="strike"
            type="number"
            domain={['dataMin', 'dataMax']}
            tickFormatter={fmtUsd}
            stroke="#71717a"
            fontSize={11}
          />
          <YAxis tickFormatter={fmtPct} stroke="#71717a" fontSize={11} />

          <Tooltip
            contentStyle={{ background: '#18181b', border: '1px solid #3f3f46' }}
            labelFormatter={(v: number) => `Strike: ${fmtUsd(v)}`}
            formatter={(v: number) => [fmtPct(v), 'Implied Vol']}
          />

          <ReferenceLine x={spot} stroke="#3b82f6" label={{ value: 'spot', fill: '#3b82f6', position: 'insideTopRight', fontSize: 10 }} />
          {Math.abs(forward - spot) / spot > 0.001 && (
            <ReferenceLine x={forward} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'forward', fill: '#10b981', position: 'insideTopLeft', fontSize: 10 }} />
          )}

          <Area type="monotone" dataKey="iv" stroke="#a855f7" strokeWidth={2} fill="url(#ivFill)" isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
