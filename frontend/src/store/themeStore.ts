import { create } from 'zustand'
import {
  type ThemeId,
  DEFAULT_THEME_ID,
  isValidThemeId,
} from '../themes/definitions'

export const THEME_STORAGE_KEY = 'algo_theme'

interface ThemeState {
  themeId: ThemeId
  initialized: boolean
  setTheme: (id: ThemeId) => void
  initTheme: () => void
}

const useThemeStore = create<ThemeState>()((set, get) => ({
  themeId: DEFAULT_THEME_ID,
  initialized: false,

  setTheme: (id) => {
    localStorage.setItem(THEME_STORAGE_KEY, id)
    set({ themeId: id })
  },

  initTheme: () => {
    if (get().initialized) return

    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    const themeId =
      stored && isValidThemeId(stored) ? stored : DEFAULT_THEME_ID

    set({ themeId, initialized: true })
  },
}))

export default useThemeStore
