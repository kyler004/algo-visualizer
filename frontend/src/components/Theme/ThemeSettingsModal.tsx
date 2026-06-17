import { motion } from 'framer-motion'
import useThemeStore from '../../store/themeStore'
import { THEME_LIST } from '../../themes/definitions'
import ThemePreviewCard from './ThemePreviewCard'

interface Props {
  onClose: () => void
}

export default function ThemeSettingsModal({ onClose }: Props) {
  const { themeId, setTheme } = useThemeStore()

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50
        flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.18 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-bg-panel border border-border-subtle rounded-xl
          p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold text-text-primary">Appearance</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded text-text-secondary hover:text-text-primary hover:bg-bg-hover"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M2 2l10 10M12 2L2 12" />
            </svg>
          </button>
        </div>
        <p className="text-sm text-text-secondary mb-5">
          Choose a color theme for the editor and visualizer panels.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {THEME_LIST.map((theme) => (
            <ThemePreviewCard
              key={theme.id}
              theme={theme}
              isActive={themeId === theme.id}
              onSelect={() => setTheme(theme.id)}
            />
          ))}
        </div>
      </motion.div>
    </div>
  )
}
