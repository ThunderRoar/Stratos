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
import { InfoTooltip } from './InfoTooltip'

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
        <Stat
          label="Max profit"
          value={'+' + fmtUsd(maxProfit)}
          color="text-profit"
          tooltip="Highest possible payout if all in-the-money legs settle in your favor. Sum of leg quantities minus net cost."
        />
        <Stat
          label="Max loss"
          value={'-' + fmtUsd(maxLoss)}
          color="text-loss"
          tooltip="Worst-case downside if every leg expires out-of-the-money. Equal to the upfront premium paid — there is no margin call."
        />
        <Stat
          label="Net cost"
          value={fmtUsd(netCost)}
          hint="paid upfront"
          tooltip="Total DUSDC required to mint all legs of this strategy. Capital is locked until you redeem or the position settles."
        />
        <Stat
          label="Prob of profit"
          value={fmtPct(pop)}
          tooltip="Estimated chance the strategy finishes in profit at expiry. Monte Carlo from a lognormal distribution at the live ATM implied vol (5000 samples)."
        />
        <Stat
          label="Delta"
          value={fmtSignedSmall(delta)}
          hint="per $1 spot move"
          tooltip="How much the position value changes when spot moves $1. Positive = you gain when spot rises. Negative = you gain when spot falls."
        />
        <Stat
          label="Theta"
          value={fmtSigned(theta)}
          hint="per day"
          tooltip="How much the position value changes per day from time decay alone (holding spot and vol constant). Usually negative for long option positions."
        />
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

function Stat({ label, value, hint, color = 'text-fg', tooltip }: { label: string; value: string; hint?: string; color?: string; tooltip?: string }) {
  return (
    <div>
      <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-fg-3 font-medium">
        {label}
        {tooltip && <InfoTooltip text={tooltip} />}
      </div>
      <div className={`mt-1 text-base font-mono ${color}`}>{value}</div>
      {hint && <div className="text-[10px] text-fg-3/70 mt-0.5">{hint}</div>}
    </div>
  )
}