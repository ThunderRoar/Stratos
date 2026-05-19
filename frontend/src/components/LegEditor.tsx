import type { Leg } from '../lib/strategy-types'

type Props = {
  leg: Leg
  index: number
  onChange: (next: Leg) => void
  minStrike?: number
  tickSize?: number
}

export function LegEditor({ leg, onChange, minStrike = 1, tickSize = 1 }: Props) {
  const sideColor = leg.side === 'buy' ? 'text-green-400' : 'text-red-400'

  return (
    <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-sm">
      <span className={`font-mono uppercase font-semibold ${sideColor}`}>
        {leg.side}
      </span>

      <span className="font-mono uppercase text-zinc-300">
        {leg.kind === 'binary' ? leg.direction : 'range'}
      </span>

      {leg.kind === 'binary' ? (
        <label className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">strike</span>
          <input
            type="number"
            value={leg.strike}
            min={minStrike}
            step={tickSize}
            onChange={(e) => onChange({...leg, strike: Number(e.target.value)})}
            className="w-28 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 font-mono text-zinc-100 focus:border-blue-500 outline-none"
          />
        </label>
      ) : (
        <span className="font-mono text-zinc-300">
          ${leg.lower.toLocaleString()}–${leg.higher.toLocaleString()}
        </span>
      )}

      <label className="flex items-center gap-2">
        <span className="text-xs text-zinc-500">qty</span>
        <input
          type="number"
          value={leg.qty}
          min={1}
          step={1}
          onChange={(e) => onChange({ ...leg, qty: Number(e.target.value) })}
          className="w-20 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 font-mono text-zinc-100 focus:border-blue-500 outline-none"
        />
      </label>

      <span className="ml-auto text-xs text-zinc-500 font-mono">
        cost ${leg.cost.toFixed(0)}
      </span>
    </div>
  )
}
