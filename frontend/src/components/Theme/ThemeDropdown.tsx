import { useState, useRef, useEffect } from 'react'
import useThemeStore from '../../store/themeStore'
import { THEME_LIST } from '../../themes/definitions'
import type { ThemeId } from '../../themes/definitions'

interface Props {
  onOpenSettings?: () => void
}

export default function ThemeDropdown({ onOpenSettings }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { themeId, setTheme } = useThemeStore()

  useEffect(() => {
    if (!open) return

    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  const selectTheme = (id: ThemeId) => {
    setTheme(id)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title="Theme"
        className="p-2 rounded text-text-secondary hover:text-text-primary
          hover:bg-bg-hover transition-colors"
      >
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="7.5" cy="7.5" r="5.5" />
          <path d="M7.5 2v11M2 7.5h11" strokeLinecap="round" />
          <path d="M4 4.5c1.5 1 5.5 1 7 0" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 w-48 py-1 rounded-lg
            bg-bg-panel border border-border-subtle shadow-xl z-50"
        >
          <p className="px-3 py-1.5 text-[10px] uppercase tracking-widest text-text-secondary">
            Theme
          </p>
          {THEME_LIST.map((theme) => (
            <button
              key={theme.id}
              onClick={() => selectTheme(theme.id)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm
                hover:bg-bg-hover transition-colors text-left"
            >
              <span
                className="w-3 h-3 rounded-full shrink-0 border border-border-subtle"
                style={{ backgroundColor: theme.swatch }}
              />
              <span className="text-text-primary flex-1">{theme.label}</span>
              {themeId === theme.id && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent-blue">
                  <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          ))}
          {onOpenSettings && (
            <>
              <div className="my-1 border-t border-border-subtle" />
              <button
                onClick={() => { setOpen(false); onOpenSettings() }}
                className="w-full px-3 py-2 text-xs text-text-secondary
                  hover:bg-bg-hover hover:text-text-primary text-left transition-colors"
              >
                All themes & previews…
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
