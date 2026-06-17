import type { editor } from 'monaco-editor'
import { THEMES, type ThemeDefinition } from './definitions'

function stripHash(hex: string): string {
  return hex.startsWith('#') ? hex.slice(1) : hex
}

export function buildMonacoTheme(def: ThemeDefinition): editor.IStandaloneThemeData {
  const { monaco: m } = def

  return {
    base: def.category === 'light' ? 'vs' : 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: stripHash(m.comment), fontStyle: 'italic' },
      { token: 'keyword', foreground: stripHash(m.keyword) },
      { token: 'string', foreground: stripHash(m.string) },
      { token: 'number', foreground: stripHash(m.number) },
    ],
    colors: {
      'editor.background': m.editorBg,
      'editor.foreground': m.editorFg,
      'editor.lineHighlightBackground': m.lineHighlight,
      'editor.selectionBackground': m.selection,
      'editorCursor.foreground': m.cursor,
      'editorLineNumber.foreground': m.lineNumber,
      'editorLineNumber.activeForeground': m.lineNumberActive,
    },
  }
}

export function registerMonacoThemes(monaco: typeof import('monaco-editor')): void {
  for (const def of Object.values(THEMES)) {
    monaco.editor.defineTheme(def.id, buildMonacoTheme(def))
  }
}
