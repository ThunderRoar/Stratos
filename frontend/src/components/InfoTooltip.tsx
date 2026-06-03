import { HelpCircle } from 'lucide-react'

type Props = {
  text: string
  size?: number
}

export function InfoTooltip({ text, size = 12 }: Props) {
  return (
    <span className="group relative inline-flex items-center">
      <HelpCircle
        className="text-fg-3 hover:text-fg-2 transition cursor-help"
        style={{ width: size, height: size }}
        strokeWidth={1.5}
      />
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 -translate-x-1/2 whitespace-normal rounded-md border border-line bg-surface-elev px-2.5 py-1.5 text-[11px] font-normal leading-snug text-fg-2 opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100"
        style={{ width: 'max-content', maxWidth: '240px' }}
      >
        {text}
      </span>
    </span>
  )
}
