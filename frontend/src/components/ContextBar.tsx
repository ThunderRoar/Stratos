import type { ReactNode } from 'react'

type Cell = {
  label: string
  value: ReactNode
}

type Props = {
  cells: Cell[]
}

export function ContextBar({ cells }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-x-10 gap-y-3 rounded-xl border border-line/60 bg-surface px-6 py-4">
      {cells.map((cell, i) => (
        <div key={i} className="flex flex-col gap-1">
          <span className="text-[10px] font-medium uppercase tracking-wider text-fg-3">
            {cell.label}
          </span>
          <span className="text-base font-semibold text-fg">{cell.value}</span>
        </div>
      ))}
    </div>
  )
}