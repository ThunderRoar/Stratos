import type { Strategy } from '../lib/strategy-types'
import {
  strategyMaxProfit,
  strategyMaxLoss,
  strategyDelta,
  strategyThetaPerDay,
  strategyProbabilityOfProfit,
  legDelta,
  legThetaPerDay,
} from '../lib/options-math'

type Props = {
  strategy: Strategy
  spot: number
  atmIv: number // decimal
  years: number // time to expiry
}

const fmtUsd = (n: number) => '$' + Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 2 })
const fmtSigned = (n: number) => (n >= 0 ? '+' : '-') + fmtUsd(n)
const fmtUsdSmall = (n: number) => '$' + Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 4 })
const fmtSignedSmall = (n: number) => (n >= 0 ? '+' : '-') + fmtUsdSmall(n)

const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`

export function RiskPanel({ strategy, spot, atmIv, years }: Props) {
  const maxProfit = strategyMaxProfit(strategy)
  const maxLoss = strategyMaxLoss(strategy)
  // For mint only strategies, showing net cost (capital deployed) and max loss because traders read them differently, one emphasizes capital required, the other emphasizes downside risk.
  const netCost = maxLoss
  const pop = strategyProbabilityOfProfit(strategy, spot, atmIv, years)
  const delta = strategyDelta(strategy, spot, atmIv, years)
  const theta = strategyThetaPerDay(strategy, spot, atmIv, years)

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 space-y-3">
      <div className="text-xs uppercase tracking-wider text-zinc-500">Risk Panel</div>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-sm">
        <Stat label="Max profit" value={'+' + fmtUsd(maxProfit)} color="text-green-400" />
        <Stat label="Max loss" value={'-' + fmtUsd(maxLoss)} color="text-red-400" />
        <Stat label="Net cost" value={fmtUsd(netCost)} hint="paid upfront" />
        <Stat label="Prob of profit" value={fmtPct(pop)} />
        <Stat label="Delta" value={fmtSignedSmall(delta)} hint="per $1 spot move" />
        <Stat label="Theta" value={fmtSigned(theta)} hint="per day" />
      </div>

      <div>
        <div className="text-xs text-zinc-500 mb-1">Per-leg Greeks</div>
        <table className="w-full text-xs">
          <thead className="text-zinc-500">
            <tr><th className="text-left font-normal py-1">Leg</th><th className="text-right font-normal">Delta</th><th className="text-right font-normal">Theta/day</th></tr>
          </thead>
          <tbody className="font-mono">
            {strategy.legs.map((leg, i) => {
              if (leg.kind !== 'binary') return null
              return (
                <tr key={i} className="border-t border-zinc-800">
                  <td className="py-1"><span className={leg.direction === 'up' ? 'text-green-400' : 'text-red-400'}>{leg.direction.toUpperCase()}</span> @ ${leg.strike.toLocaleString()}</td>
                  <td className="text-right">{fmtSignedSmall(legDelta(leg, spot, atmIv, years))}</td>
                  <td className="text-right">{fmtSigned(legThetaPerDay(leg, spot, atmIv, years))}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Stat({ label, value, hint, color = 'text-zinc-100' }: { label: string; value: string; hint?: string; color?: string }) {
  return (
    <div>
      <div className="text-xs text-zinc-500">{label}</div>
      <div className={`mt-1 text-base font-mono ${color}`}>{value}</div>
      {hint && <div className="text-[10px] text-zinc-600">{hint}</div>}
    </div>
  )
}
