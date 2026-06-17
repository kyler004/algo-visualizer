import type { ThemeDefinition } from '../../themes/definitions'

interface Props {
  theme: ThemeDefinition
  isActive: boolean
  onSelect: () => void
}

export default function ThemePreviewCard({ theme, isActive, onSelect }: Props) {
  return (
    <button
      onClick={onSelect}
      data-theme={theme.id}
      className={`text-left rounded-xl border overflow-hidden transition-all
        hover:scale-[1.02] active:scale-[0.99]
        ${isActive
          ? 'border-accent-blue ring-2 ring-accent-blue/30'
          : 'border-border-subtle hover:border-accent-blue/40'}`}
    >
      {/* Mini editor + panel mock */}
      <div className="flex h-24 bg-bg-primary">
        <div className="flex-[3] bg-bg-secondary border-r border-border-subtle p-2 font-mono text-[9px] text-text-secondary space-y-0.5">
          <div><span className="text-accent-blue">def</span> sort():</div>
          <div className="pl-2">arr = [<span className="text-accent-amber">1</span>, <span className="text-accent-amber">3</span>]</div>
          <div className="pl-2 bg-accent-blue/10 border-l-2 border-accent-blue">return arr</div>
        </div>
        <div className="flex-[2] bg-bg-panel p-2 space-y-1">
          <div className="text-[8px] uppercase tracking-widest text-text-secondary">vars</div>
          <div className="rounded bg-bg-hover px-1.5 py-1 text-[8px] font-mono">
            <span className="text-text-secondary">arr </span>
            <span className="text-accent-green">list</span>
          </div>
          <div className="rounded border border-instance/30 bg-instance/5 px-1.5 py-0.5 text-[8px] font-mono text-instance">
            Node(5)
          </div>
        </div>
      </div>

      {/* Swatches + label */}
      <div className="px-3 py-2.5 bg-bg-secondary border-t border-border-subtle">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-text-primary">{theme.label}</p>
            <p className="text-[10px] text-text-secondary mt-0.5 line-clamp-1">
              {theme.description}
            </p>
          </div>
          {isActive && (
            <span className="text-accent-blue text-xs shrink-0">Active</span>
          )}
        </div>
        <div className="flex gap-1 mt-2">
          {[theme.colors.accentBlue, theme.colors.accentAmber, theme.colors.accentGreen, theme.colors.instance].map((c) => (
            <span
              key={c}
              className="w-4 h-4 rounded-sm border border-border-subtle"
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
    </button>
  )
}
