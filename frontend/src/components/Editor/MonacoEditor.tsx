import { useRef, useEffect } from "react";
import Editor, { type BeforeMount, type OnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import useExecutionStore from "../../store/executionStore";
import useCollabStore from "../../store/collabStore";
import CursorOverlay from "../Collaboration/CursorOverlay";

const THEME_NAME = "algo-dark";

const MONACO_THEME: editor.IStandaloneThemeData = {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "comment", foreground: "4a5568", fontStyle: "italic" },
    { token: "keyword", foreground: "4d9fff" },
    { token: "string", foreground: "f6ad55" },
    { token: "number", foreground: "f6e05e" },
  ],
  colors: {
    "editor.background": "#111118",
    "editor.foreground": "#e2e8f0",
    "editor.lineHighlightBackground": "#1a1a25",
    "editor.selectionBackground": "#2d4a6e60",
    "editorCursor.foreground": "#4d9fff",
    "editorLineNumber.foreground": "#2d3748",
    "editorLineNumber.activeForeground": "#4d9fff",
  },
};

interface Props {
  // Optional: passed in when collab is active
  onCodeChange?: (code: string) => void;
  onCursorChange?: (line: number, column: number) => void;
}

export default function MonacoEditor({ onCodeChange, onCursorChange }: Props) {
  const { code, setCode, language, steps, currentStepIndex } =
    useExecutionStore();
  const { slug } = useCollabStore();

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Parameters<BeforeMount>[0] | null>(null);
  const decorationsRef = useRef<string[]>([]);

  const currentStep = steps[currentStepIndex];

  const handleBeforeMount: BeforeMount = (monaco) => {
    monaco.editor.defineTheme(THEME_NAME, MONACO_THEME);
    monacoRef.current = monaco;
  };

  const handleMount: OnMount = (editorInstance) => {
    editorRef.current = editorInstance;

    // Broadcast cursor position whenever it changes
    if (onCursorChange) {
      editorInstance.onDidChangeCursorPosition((e) => {
        onCursorChange(e.position.lineNumber, e.position.column);
      });
    }
  };

  // Highlight currently executing line
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;
    if (!currentStep) {
      decorationsRef.current = editorRef.current.deltaDecorations(
        decorationsRef.current,
        [],
      );
      return;
    }
    decorationsRef.current = editorRef.current.deltaDecorations(
      decorationsRef.current,
      [
        {
          range: new monacoRef.current.Range(
            currentStep.line,
            1,
            currentStep.line,
            1,
          ),
          options: { isWholeLine: true, className: "executing-line-highlight" },
        },
      ],
    );
  }, [currentStep]);

  const handleChange = (value: string | undefined) => {
    const newCode = value ?? "";
    setCode(newCode);
    onCodeChange?.(newCode); // Broadcast if in a collab session
  };

  return (
    <div className="h-full w-full relative">
      <Editor
        height="100%"
        language={language}
        value={code}
        theme={THEME_NAME}
        beforeMount={handleBeforeMount}
        onMount={handleMount}
        onChange={handleChange}
        options={{
          fontSize: 14,
          fontFamily: '"JetBrains Mono", monospace',
          fontLigatures: true,
          minimap: { enabled: false },
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 16, bottom: 16 },
          renderLineHighlight: "none",
          cursorSmoothCaretAnimation: "on",
        }}
      />

      {/* Remote cursor overlay — only active during collab sessions */}
      {slug && (
        <CursorOverlay
          editorInstance={editorRef.current}
          monacoInstance={monacoRef.current}
        />
      )}
    </div>
  );
}
