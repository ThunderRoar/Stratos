import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { TrendingUp } from 'lucide-react'
import { useVaultPerformance } from '../hooks/useVault'

type Range = '1D' | '1W' | '1M' | 'ALL'

const RANGE_MS: Record<Range, number | null> = {
  '1D': 24 * 60 * 60 * 1000,
  '1W': 7 * 24 * 60 * 60 * 1000,
  '1M': 30 * 24 * 60 * 60 * 1000,
  ALL: null,
}

const RANGES: Range[] = ['1D', '1W', '1M', 'ALL']

const fmtDate = (ms: number) =>
  new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
const fmtDateFull = (ms: number) => new Date(ms).toLocaleString()
const fmtPrice = (n: number) => n.toFixed(4)
const fmtReturn = (price: number) => {
  const pct = (price - 1) * 100
  return (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%'
}

export function VaultPerformanceChart() {
  const { data, isLoading, error } = useVaultPerformance('ALL')
  const [range, setRange] = useState<Range>('ALL')

  // Compute filtered set and per-range validity in one pass. A range is "valid" only if it has
  // at least 2 points — fewer than that cannot draw a line.
  const { filteredPoints, validRanges } = useMemo(() => {
    if (!data || data.points.length === 0) {
      return { filteredPoints: [], validRanges: new Set<Range>(['ALL']) }
    }
    const now = Date.now()
    const valid = new Set<Range>(['ALL'])
    for (const r of RANGES) {
      if (r === 'ALL') continue
      const cutoff = now - (RANGE_MS[r] as number)
      const count = data.points.filter((p) => p.timestamp_ms >= cutoff).length
      if (count >= 2) valid.add(r)
    }
    const cutoff = RANGE_MS[range] !== null ? now - (RANGE_MS[range] as number) : 0
    const filtered = data.points.filter((p) => p.timestamp_ms >= cutoff)
    return { filteredPoints: filtered, validRanges: valid }
  }, [data, range])

  if (isLoading) {
    return (
      <ChartFrame>
        <div className="h-64 flex items-center justify-center text-sm text-fg-3">
          Loading vault history…
        </div>
      </ChartFrame>
    )
  }
  if (error) {
    return (
      <ChartFrame>
        <div className="h-64 flex items-center justify-center text-sm text-loss">
          Failed to load history: {error.message}
        </div>
      </ChartFrame>
    )
  }
  if (!data || data.points.length === 0 || filteredPoints.length === 0) {
    return (
      <ChartFrame range={range} setRange={setRange} validRanges={validRanges}>
        <div className="h-64 flex items-center justify-center text-sm text-fg-3">
          No vault history in this range
        </div>
      </ChartFrame>
    )
  }

  const latest = data.points[data.points.length - 1]
  const lifetimePct = (latest.share_price - 1) * 100
  const rangeFirst = filteredPoints[0]
  const rangeLast = filteredPoints[filteredPoints.length - 1]
  const prices = filteredPoints.map((p) => p.share_price)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const padding = Math.max((maxPrice - minPrice) * 0.15, 0.0001)
  const yDomain: [number, number] = [minPrice - padding, maxPrice + padding]
  const isRangeDown = rangeLast.share_price < rangeFirst.share_price
  const chartColor = isRangeDown ? '#FF6B6B' : '#20C997'

  return (
    <ChartFrame range={range} setRange={setRange} validRanges={validRanges}>
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-fg-3 font-semibold">
            Share price over time
          </div>
          <div className="mt-1 text-2xl font-mono font-semibold text-fg">
            {fmtPrice(latest.share_price)}
            <span className={`ml-2 text-sm font-sans ${lifetimePct >= 0 ? 'text-profit' : 'text-loss'}`}>
              {fmtReturn(latest.share_price)} lifetime
            </span>
          </div>
        </div>
        <div className="text-xs text-fg-3">
          {filteredPoints.length} point{filteredPoints.length === 1 ? '' : 's'} · since {fmtDate(rangeFirst.timestamp_ms)}
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredPoints} margin={{ top: 10, right: 16, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="vaultGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartColor} stopOpacity={0.35} />
                <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#1A2032" strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp_ms"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={fmtDate}
              stroke="#6B7894"
              fontSize={11}
              minTickGap={40}
            />
            <YAxis
              tickFormatter={fmtPrice}
              domain={yDomain}
              stroke="#6B7894"
              fontSize={11}
              width={72}
            />
            <Tooltip
              contentStyle={{
                background: '#0A0E18',
                border: '1px solid #1A2032',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelStyle={{ color: '#6B7894' }}
              itemStyle={{ color: '#FFFFFF' }}
              labelFormatter={(v) => fmtDateFull(Number(v))}
              formatter={(value) => [fmtPrice(Number(value)), 'Share price']}
            />
            <Area
              type="monotone"
              dataKey="share_price"
              stroke={chartColor}
              strokeWidth={2}
              fill="url(#vaultGradient)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartFrame>
  )
}

type ChartFrameProps = {
  children: React.ReactNode
  range?: Range
  setRange?: (r: Range) => void
  validRanges?: Set<Range>
}

function ChartFrame({ children, range, setRange, validRanges }: ChartFrameProps) {
  return (
    <div className="rounded-lg border border-line/60 bg-surface p-5">
      <div className="flex items-center justify-between mb-1">
        <div className="text-[10px] uppercase tracking-wider text-fg-3 font-semibold inline-flex items-center gap-2">
          <TrendingUp className="h-3.5 w-3.5 text-profit" strokeWidth={1.5} />
          Performance
        </div>
        {range && setRange && validRanges && (
          <div className="inline-flex rounded-full bg-surface-elev p-0.5 text-[11px]">
            {RANGES.map((r) => {
              const isActive = r === range
              const isValid = validRanges.has(r)
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => isValid && setRange(r)}
                  disabled={!isValid}
                  className={`rounded-full px-2.5 py-1 transition ${
                    isActive
                      ? 'bg-accent text-bg font-medium'
                      : isValid
                        ? 'text-fg-3 hover:text-fg'
                        : 'text-fg-3/40'
                  }`}
                  title={isValid ? `Show last ${r}` : `Not enough data for ${r}`}
                >
                  {r}
                </button>
              )
            })}
          </div>
        )}
      </div>
      {children}
    </div>
  )
}
