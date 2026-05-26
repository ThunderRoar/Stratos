import type { ReactNode } from 'react'

type Variant =
  | 'up'
  | 'down'
  | 'active'
  | 'pending'
  | 'settled'
  | 'analytical'
  | 'neutral'

const STYLES: Record<Variant, string> = {
  up:         'bg-profit/15 text-profit',
  down:       'bg-loss/15 text-loss',
  active:     'bg-accent/15 text-accent',
  pending:    'bg-warn/15 text-warn',
  settled:    'bg-surface-elev text-fg-2',
  analytical: 'bg-analytical/15 text-analytical',
  neutral:    'bg-surface-elev text-fg-2',
}

export function StatusLabel({
  variant = 'neutral',
  children,
}: {
  variant?: Variant
  children: ReactNode
}) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${STYLES[variant]}`}
    >
      {children}
    </span>
  )
}