import { useRef, useEffect, useState } from "react";
import Editor, { type BeforeMount, type OnMount } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import useExecutionStore from "../../store/executionStore";
import useCollabStore from "../../store/collabStore";
import useThemeStore from "../../store/themeStore";
import { registerMonacoThemes } from "../../themes/monaco";
import { DEFAULT_THEME_ID } from "../../themes/definitions";
import CursorOverlay from "../Collaboration/CursorOverlay";

interface Props {
  onCodeChange?: (code: string) => void;
  onCursorChange?: (line: number, column: number) => void;
}

export default function MonacoEditor({ onCodeChange, onCursorChange }: Props) {
  const { code, setCode, language, steps, currentStepIndex } =
    useExecutionStore();
  const { slug } = useCollabStore();
  const themeId = useThemeStore((s) => s.themeId);

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Parameters<BeforeMount>[0] | null>(null);
  const decorationsRef = useRef<string[]>([]);
  const [mountedEditor, setMountedEditor] = useState<editor.IStandaloneCodeEditor | null>(null);
  const [mountedMonaco, setMountedMonaco] = useState<Parameters<BeforeMount>[0] | null>(null);

  const currentStep = steps[currentStepIndex];

  const handleBeforeMount: BeforeMount = (monaco) => {
    registerMonacoThemes(monaco);
    monacoRef.current = monaco;
    setMountedMonaco(monaco);
  };

  const handleMount: OnMount = (editorInstance) => {
    editorRef.current = editorInstance;
    setMountedEditor(editorInstance);

    if (onCursorChange) {
      editorInstance.onDidChangeCursorPosition((e) => {
        onCursorChange(e.position.lineNumber, e.position.column);
      });
    }
  };

  useEffect(() => {
    if (!monacoRef.current) return;
    monacoRef.current.editor.setTheme(themeId);
  }, [themeId]);

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
    onCodeChange?.(newCode);
  };

  return (
    <div className="h-full w-full relative">
      <Editor
        height="100%"
        language={language}
        value={code}
        theme={themeId ?? DEFAULT_THEME_ID}
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

      {slug && mountedEditor && mountedMonaco && (
        <CursorOverlay
          editorInstance={mountedEditor}
          monacoInstance={mountedMonaco}
        />
      )}
    </div>
  );
}
