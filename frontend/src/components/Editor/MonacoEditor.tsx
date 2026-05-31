import { useRef, useEffect } from 'react'
import Editor, { type BeforeMount, type OnMount } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import useExecutionStore from '../../store/executionStore'

const THEME_NAME = 'algo-dark'

// editor.IStandaloneThemeData gives us type safety on the theme object
const MONACO_THEME: editor.IStandaloneThemeData = {
    base: 'vs-dark',
    inherit: true,
    rules: [
        { token: 'comment', foreground: '4a5568', fontStyle: 'italic' },
        { token: 'keyword', foreground: '4d9fff' },
        { token: 'string',  foreground: 'f6ad55' },
        { token: 'number',  foreground: 'f6e05e' },
    ],
    colors: {
        'editor.background':                '#111118',
        'editor.foreground':                '#e2e8f0',
        'editor.lineHighlightBackground':   '#1a1a25',
        'editor.selectionBackground':       '#2d4a6e60',
        'editorCursor.foreground':          '#4d9fff',
        'editorLineNumber.foreground':      '#2d3748',
        'editorLineNumber.activeForeground':'#4d9fff',
    },
}

export default function MonacoEditor() {
    const { code, setCode, language, steps, currentStepIndex } =
        useExecutionStore()

    // Properly typed refs — Monaco's own types, not generic `any`
    const editorRef      = useRef<editor.IStandaloneCodeEditor | null>(null)
    const monacoRef      = useRef<Parameters<BeforeMount>[0] | null>(null)
    const decorationsRef = useRef<string[]>([])

    const currentStep = steps[currentStepIndex]

    const handleBeforeMount: BeforeMount = (monaco) => {
        monaco.editor.defineTheme(THEME_NAME, MONACO_THEME)
        monacoRef.current = monaco
    }

    const handleMount: OnMount = (editor) => {
        editorRef.current = editor
    }

    useEffect(() => {
        if (!editorRef.current || !monacoRef.current) return

        if (!currentStep) {
            decorationsRef.current = editorRef.current.deltaDecorations(
                decorationsRef.current, []
            )
            return
        }

        decorationsRef.current = editorRef.current.deltaDecorations(
            decorationsRef.current,
            [{
                range: new monacoRef.current.Range(currentStep.line, 1, currentStep.line, 1),
                options: { isWholeLine: true, className: 'executing-line-highlight' },
            }]
        )
    }, [currentStep])

    return (
        <div className="h-full w-full">
            <Editor
                height="100%"
                language={language}
                value={code}
                theme={THEME_NAME}
                beforeMount={handleBeforeMount}
                onMount={handleMount}
                onChange={(value) => setCode(value ?? '')}
                options={{
                    fontSize: 14,
                    fontFamily: '"JetBrains Mono", monospace',
                    fontLigatures: true,
                    minimap: { enabled: false },
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    padding: { top: 16, bottom: 16 },
                    renderLineHighlight: 'none',
                    cursorSmoothCaretAnimation: 'on',
                }}
            />
        </div>
    )
}