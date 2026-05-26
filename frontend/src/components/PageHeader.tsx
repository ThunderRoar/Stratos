import type { ReactNode } from 'react'

type Props = {
  title: string
  subtitle?: string
  right?: ReactNode
}

export function PageHeader({ title, subtitle, right }: Props) {
  return (
    <div className="flex items-end justify-between gap-4 flex-wrap pb-2 mb-2">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-fg">{title}</h1>
        {subtitle && (
          <p className="text-sm text-fg-2 mt-2">{subtitle}</p>
        )}
      </div>
      {right && <div>{right}</div>}
    </div>
  )
}