import { useEffect } from 'react'
import useThemeStore from '../store/themeStore'
import { getTheme } from '../themes/definitions'

export default function useTheme() {
  const { themeId, initTheme } = useThemeStore()

  useEffect(() => {
    initTheme()
  }, [initTheme])

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', themeId)

    const theme = getTheme(themeId)
    root.style.colorScheme = theme.category
  }, [themeId])
}
