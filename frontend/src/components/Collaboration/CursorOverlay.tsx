import { useEffect, useRef } from "react";
import type { editor } from "monaco-editor";
import useCollabStore from "../../store/collabStore";

interface Props {
  // We pass the editor instance down from MonacoEditor
  editorInstance: editor.IStandaloneCodeEditor | null;
  monacoInstance: typeof import("monaco-editor") | null;
}

export default function CursorOverlay({
  editorInstance,
  monacoInstance,
}: Props) {
  const { remoteCursors } = useCollabStore();
  // Track decoration IDs so we can remove them when cursors move
  const decorationIdsRef = useRef<string[]>([]);

  useEffect(() => {
    if (!editorInstance || !monacoInstance) return;

    // Build new decorations for all remote cursors
    const newDecorations: editor.IModelDeltaDecoration[] = remoteCursors.map(
      (cursor) => ({
        range: new monacoInstance.Range(
          cursor.position.lineNumber,
          cursor.position.column,
          cursor.position.lineNumber,
          cursor.position.column + 1, // +1 so the decoration has width
        ),
        options: {
          className: `remote-cursor-${cursor.user.id}`,
          beforeContentClassName: `remote-cursor-label-${cursor.user.id}`,
          stickiness:
            monacoInstance.editor.TrackedRangeStickiness
              .NeverGrowsWhenTypingAtEdges,
        },
      }),
    );

    // Replace old decorations with new ones — Monaco handles the diff
    decorationIdsRef.current = editorInstance.deltaDecorations(
      decorationIdsRef.current,
      newDecorations,
    );

    // Inject dynamic CSS for each remote user's cursor colour
    const styleId = "remote-cursors-style";
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    styleEl.textContent = remoteCursors
      .map(
        (c) => `
          .remote-cursor-${c.user.id} {
            border-left: 2px solid ${c.user.color};
            margin-left: -1px;
          }
          .remote-cursor-label-${c.user.id}::before {
            content: '${c.user.name}';
            background: ${c.user.color};
            color: white;
            font-size: 10px;
            font-family: 'Outfit', sans-serif;
            padding: 1px 5px;
            border-radius: 2px;
            position: absolute;
            top: -18px;
            left: 0;
            white-space: nowrap;
            z-index: 100;
          }`,
      )
      .join("\n");
  }, [remoteCursors, editorInstance, monacoInstance]);

  // This component renders nothing itself — it only manipulates Monaco decorations
  return null;
}
