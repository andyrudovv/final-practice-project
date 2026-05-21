"use client";

import Editor from "@monaco-editor/react";
import { useRef, useCallback } from "react";
import type { editor } from "monaco-editor";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function CodeEditor({ value, onChange }: CodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleMount = useCallback((editorInstance: editor.IStandaloneCodeEditor) => {
    editorRef.current = editorInstance;
  }, []);

  const handleChange = useCallback(
    (newValue: string | undefined) => {
      if (newValue !== undefined) {
        onChange(newValue);
      }
    },
    [onChange]
  );

  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        defaultLanguage="html"
        value={value}
        onChange={handleChange}
        onMount={handleMount}
        theme="vs"
        loading={
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
              <span className="text-sm text-gray-500">Loading code editor...</span>
            </div>
          </div>
        }
        options={{
          minimap: { enabled: true },
          fontSize: 13,
          lineNumbers: "on",
          wordWrap: "on",
          tabSize: 2,
          insertSpaces: true,
          automaticLayout: true,
          scrollBeyondLastLine: false,
          formatOnPaste: true,
          formatOnType: true,
          renderWhitespace: "selection",
          bracketPairColorization: { enabled: true },
          padding: { top: 10 },
          suggestOnTriggerCharacters: true,
          quickSuggestions: true,
          folding: true,
          foldingStrategy: "indentation",
        }}
      />
    </div>
  );
}
