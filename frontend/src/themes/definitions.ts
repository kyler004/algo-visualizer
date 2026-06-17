export type ThemeId =
  | 'algo-dark'
  | 'dracula'
  | 'nord'
  | 'light'
  | 'high-contrast'

export type ThemeCategory = 'dark' | 'light'

export interface ThemeColors {
  bgPrimary: string
  bgSecondary: string
  bgPanel: string
  bgHover: string
  borderSubtle: string
  textPrimary: string
  textSecondary: string
  accentBlue: string
  accentAmber: string
  accentGreen: string
  accentPurple: string
  accentRed: string
  instance: string
  ref: string
  edge: string
  executingLineBg: string
  executingLineBorder: string
  scrollbarThumb: string
  scrollbarThumbHover: string
}

export interface ThemeMonaco {
  editorBg: string
  editorFg: string
  lineHighlight: string
  selection: string
  cursor: string
  lineNumber: string
  lineNumberActive: string
  keyword: string
  string: string
  comment: string
  number: string
}

export interface ThemeDefinition {
  id: ThemeId
  label: string
  description: string
  category: ThemeCategory
  swatch: string
  colors: ThemeColors
  monaco: ThemeMonaco
}

const algoDarkColors: ThemeColors = {
  bgPrimary: '#0a0a0f',
  bgSecondary: '#111118',
  bgPanel: '#16161f',
  bgHover: '#1e1e2e',
  borderSubtle: '#1e1e2e',
  textPrimary: '#e2e8f0',
  textSecondary: '#64748b',
  accentBlue: '#4d9fff',
  accentAmber: '#f59e0b',
  accentGreen: '#22c55e',
  accentPurple: '#a78bfa',
  accentRed: '#ef4444',
  instance: '#c084fc',
  ref: '#a78bfa',
  edge: '#7c3aed',
  executingLineBg: 'rgba(77, 159, 255, 0.08)',
  executingLineBorder: '#4d9fff',
  scrollbarThumb: '#1e1e2e',
  scrollbarThumbHover: '#2d3748',
}

export const THEMES: Record<ThemeId, ThemeDefinition> = {
  'algo-dark': {
    id: 'algo-dark',
    label: 'Algo Dark',
    description: 'Default deep navy theme with blue accents.',
    category: 'dark',
    swatch: '#4d9fff',
    colors: algoDarkColors,
    monaco: {
      editorBg: '#111118',
      editorFg: '#e2e8f0',
      lineHighlight: '#1a1a25',
      selection: '#2d4a6e60',
      cursor: '#4d9fff',
      lineNumber: '#2d3748',
      lineNumberActive: '#4d9fff',
      keyword: '#4d9fff',
      string: '#f6ad55',
      comment: '#4a5568',
      number: '#f6e05e',
    },
  },
  dracula: {
    id: 'dracula',
    label: 'Dracula',
    description: 'Purple and pink accents on a classic dark base.',
    category: 'dark',
    swatch: '#bd93f9',
    colors: {
      bgPrimary: '#282a36',
      bgSecondary: '#21222c',
      bgPanel: '#343746',
      bgHover: '#3d4051',
      borderSubtle: '#44475a',
      textPrimary: '#f8f8f2',
      textSecondary: '#6272a4',
      accentBlue: '#8be9fd',
      accentAmber: '#ffb86c',
      accentGreen: '#50fa7b',
      accentPurple: '#bd93f9',
      accentRed: '#ff5555',
      instance: '#bd93f9',
      ref: '#a78bfa',
      edge: '#ff79c6',
      executingLineBg: 'rgba(189, 147, 249, 0.12)',
      executingLineBorder: '#bd93f9',
      scrollbarThumb: '#44475a',
      scrollbarThumbHover: '#6272a4',
    },
    monaco: {
      editorBg: '#21222c',
      editorFg: '#f8f8f2',
      lineHighlight: '#2d2f3d',
      selection: '#44475a80',
      cursor: '#f8f8f0',
      lineNumber: '#6272a4',
      lineNumberActive: '#bd93f9',
      keyword: '#ff79c6',
      string: '#f1fa8c',
      comment: '#6272a4',
      number: '#bd93f9',
    },
  },
  nord: {
    id: 'nord',
    label: 'Nord',
    description: 'Cool arctic blues for calm, focused sessions.',
    category: 'dark',
    swatch: '#88c0d0',
    colors: {
      bgPrimary: '#2e3440',
      bgSecondary: '#3b4252',
      bgPanel: '#434c5e',
      bgHover: '#4c566a',
      borderSubtle: '#4c566a',
      textPrimary: '#eceff4',
      textSecondary: '#81a1c1',
      accentBlue: '#88c0d0',
      accentAmber: '#ebcb8b',
      accentGreen: '#a3be8c',
      accentPurple: '#b48ead',
      accentRed: '#bf616a',
      instance: '#b48ead',
      ref: '#81a1c1',
      edge: '#5e81ac',
      executingLineBg: 'rgba(136, 192, 208, 0.12)',
      executingLineBorder: '#88c0d0',
      scrollbarThumb: '#4c566a',
      scrollbarThumbHover: '#5e81ac',
    },
    monaco: {
      editorBg: '#3b4252',
      editorFg: '#eceff4',
      lineHighlight: '#434c5e',
      selection: '#4c566a80',
      cursor: '#88c0d0',
      lineNumber: '#4c566a',
      lineNumberActive: '#88c0d0',
      keyword: '#81a1c1',
      string: '#a3be8c',
      comment: '#616e88',
      number: '#b48ead',
    },
  },
  light: {
    id: 'light',
    label: 'Paper Light',
    description: 'Clean light theme for daytime and presentations.',
    category: 'light',
    swatch: '#2563eb',
    colors: {
      bgPrimary: '#f8f9fc',
      bgSecondary: '#ffffff',
      bgPanel: '#f1f5f9',
      bgHover: '#e2e8f0',
      borderSubtle: '#e2e8f0',
      textPrimary: '#1e293b',
      textSecondary: '#64748b',
      accentBlue: '#2563eb',
      accentAmber: '#d97706',
      accentGreen: '#16a34a',
      accentPurple: '#7c3aed',
      accentRed: '#dc2626',
      instance: '#7c3aed',
      ref: '#8b5cf6',
      edge: '#6d28d9',
      executingLineBg: 'rgba(37, 99, 235, 0.08)',
      executingLineBorder: '#2563eb',
      scrollbarThumb: '#cbd5e1',
      scrollbarThumbHover: '#94a3b8',
    },
    monaco: {
      editorBg: '#ffffff',
      editorFg: '#1e293b',
      lineHighlight: '#f1f5f9',
      selection: '#2563eb30',
      cursor: '#2563eb',
      lineNumber: '#94a3b8',
      lineNumberActive: '#2563eb',
      keyword: '#2563eb',
      string: '#d97706',
      comment: '#94a3b8',
      number: '#16a34a',
    },
  },
  'high-contrast': {
    id: 'high-contrast',
    label: 'High Contrast',
    description: 'Maximum contrast for accessibility and clarity.',
    category: 'dark',
    swatch: '#facc15',
    colors: {
      bgPrimary: '#000000',
      bgSecondary: '#0a0a0a',
      bgPanel: '#141414',
      bgHover: '#1f1f1f',
      borderSubtle: '#404040',
      textPrimary: '#ffffff',
      textSecondary: '#a3a3a3',
      accentBlue: '#22d3ee',
      accentAmber: '#facc15',
      accentGreen: '#4ade80',
      accentPurple: '#e879f9',
      accentRed: '#f87171',
      instance: '#e879f9',
      ref: '#c084fc',
      edge: '#a855f7',
      executingLineBg: 'rgba(250, 204, 21, 0.15)',
      executingLineBorder: '#facc15',
      scrollbarThumb: '#404040',
      scrollbarThumbHover: '#737373',
    },
    monaco: {
      editorBg: '#0a0a0a',
      editorFg: '#ffffff',
      lineHighlight: '#1a1a1a',
      selection: '#facc1540',
      cursor: '#facc15',
      lineNumber: '#737373',
      lineNumberActive: '#facc15',
      keyword: '#22d3ee',
      string: '#facc15',
      comment: '#737373',
      number: '#4ade80',
    },
  },
}

export const THEME_LIST = Object.values(THEMES)

export const DEFAULT_THEME_ID: ThemeId = 'algo-dark'

export function getTheme(id: ThemeId): ThemeDefinition {
  return THEMES[id]
}

export function isDarkTheme(id: ThemeId): boolean {
  return THEMES[id].category === 'dark'
}

export function isValidThemeId(value: string): value is ThemeId {
  return value in THEMES
}
