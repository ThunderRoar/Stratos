import type { StrategyTemplate } from '../lib/strategy-types'
import { ALL_TEMPLATES } from '../lib/strategies'

type Props = {
  selectedId: string | null
  onSelect: (template: StrategyTemplate) => void
}

export function StrategyTemplates({ selectedId, onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {ALL_TEMPLATES.map((template) => {
        const active = template.id === selectedId
        return (
          <button
            key={template.id}
            onClick={() => onSelect(template)}
            className={['text-left rounded-lg border p-3 transition', 
              active ? 'border-blue-500 bg-blue-500/10' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'].join(' ')}
          >
            <div className="text-sm font-semibold">{template.name}</div>
            <div className="mt-1 text-xs text-zinc-500">{template.description}</div>
          </button>
        )
      })}
    </div>
  )
}
