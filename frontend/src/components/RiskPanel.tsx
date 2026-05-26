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
import { StatusLabel } from './StatusLabel'

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
    <div className="rounded-lg border border-line/60 bg-surface p-4 space-y-3">
      <div className="text-[11px] uppercase tracking-wider text-fg-3 font-semibold">Risk Panel</div>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-sm">
        <Stat label="Max profit" value={'+' + fmtUsd(maxProfit)} color="text-profit" />
        <Stat label="Max loss" value={'-' + fmtUsd(maxLoss)} color="text-loss" />
        <Stat label="Net cost" value={fmtUsd(netCost)} hint="paid upfront" />
        <Stat label="Prob of profit" value={fmtPct(pop)} />
        <Stat label="Delta" value={fmtSignedSmall(delta)} hint="per $1 spot move" />
        <Stat label="Theta" value={fmtSigned(theta)} hint="per day" />
      </div>

      <div>
        <div className="text-xs text-fg-3 mb-1">Per-leg Greeks</div>
        <table className="w-full text-xs">
          <thead className="text-fg-3">
            <tr>
              <th className="text-left font-normal py-1">Leg</th>
              <th className="text-right font-normal">Delta</th>
              <th className="text-right font-normal">Theta/day</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {strategy.legs.map((leg, i) => {
              if (leg.kind !== 'binary') return null
              return (
                <tr key={i} className="border-t border-line">
                  <td className="py-1 flex items-center gap-2">
                    <StatusLabel variant={leg.direction === 'up' ? 'up' : 'down'}>
                      {leg.direction.toUpperCase()}
                    </StatusLabel>
                    <span className="text-fg-2">@ ${leg.strike.toLocaleString()}</span>
                  </td>
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

function Stat({ label, value, hint, color = 'text-fg' }: { label: string; value: string; hint?: string; color?: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-fg-3 font-medium">{label}</div>
      <div className={`mt-1 text-base font-mono ${color}`}>{value}</div>
      {hint && <div className="text-[10px] text-fg-3/70 mt-0.5">{hint}</div>}
    </div>
  )
}