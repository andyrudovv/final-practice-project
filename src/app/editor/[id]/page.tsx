"use client";

import { useEffect, useState, useCallback, useRef, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Navbar from "@/components/layout/Navbar";

const CodeEditor = dynamic(() => import("@/components/editor/CodeEditor"), { ssr: false });
const VisualEditor = dynamic(() => import("@/components/editor/VisualEditor"), { ssr: false });

interface DocumentData {
  id: string;
  name: string;
  html: string;
  formData: Record<string, string> | null;
  status: "DRAFT" | "FINAL";
  templateVersion: number;
  createdAt: string;
  updatedAt: string;
  template: {
    name: string;
    category: string | null;
    html: string;
    css: string | null;
    js: string | null;
  };
  versions: Array<{
    id: string;
    html: string;
    comment: string | null;
    createdAt: string;
  }>;
}

type EditorMode = "visual" | "code" | "preview";

export default function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [doc, setDoc] = useState<DocumentData | null>(null);
  const [html, setHtml] = useState("");
  const [docName, setDocName] = useState("");
  const [mode, setMode] = useState<EditorMode>("visual");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedHtml = useRef("");

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [authStatus, router]);

  useEffect(() => {
    fetch(`/api/documents/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          router.push("/documents");
          return;
        }
        setDoc(data);
        setHtml(data.html);
        setDocName(data.name);
        lastSavedHtml.current = data.html;
        setLoading(false);
      })
      .catch(() => router.push("/documents"));
  }, [id, router]);

  const htmlRef = useRef(html);
  useEffect(() => { htmlRef.current = html; }, [html]);

  const saveDocument = useCallback(
    async (explicitHtml?: string, status?: string) => {
      const htmlToSave = explicitHtml ?? htmlRef.current;
      if (htmlToSave === lastSavedHtml.current && !status) return;

      setSaving(true);
      try {
        const res = await fetch(`/api/documents/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: docName,
            html: htmlToSave,
            status: status || undefined,
          }),
        });
        if (res.ok) {
          lastSavedHtml.current = htmlToSave;
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
          if (status) {
            const updated = await res.json();
            setDoc((prev) => (prev ? { ...prev, ...updated } : prev));
          }
        }
      } finally {
        setSaving(false);
      }
    },
    [id, docName]
  );

  const handleHtmlChange = useCallback(
    (newHtml: string) => {
      setHtml(newHtml);
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => {
        saveDocument(newHtml);
      }, 5000);
    },
    [saveDocument]
  );

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (html !== lastSavedHtml.current) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [html]);

  function flushVisualEditor() {
    const flush = (window as unknown as Record<string, unknown>).__veFlush;
    if (typeof flush === "function") flush();
  }

  function exportHtml() {
    flushVisualEditor();
    setTimeout(() => {
      const currentHtml = htmlRef.current;
      const blob = new Blob([currentHtml], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${docName.replace(/\s+/g, "_")}.html`;
      a.click();
      URL.revokeObjectURL(url);
    }, 400);
  }

  function printDocument() {
    flushVisualEditor();
    setTimeout(() => {
      const currentHtml = htmlRef.current;
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(currentHtml);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    }, 400);
  }

  async function restoreVersion(versionId: string) {
    const version = doc?.versions.find((v) => v.id === versionId);
    if (!version) return;
    setHtml(version.html);
    setShowVersions(false);
    await saveDocument(version.html);
  }

  if (loading || !session) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  if (!doc) return null;

  return (
    <div className="flex h-screen flex-col">
      <Navbar />

      {/* Editor toolbar */}
      <div className="border-b border-gray-200 bg-white px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/documents")}
              className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              title="Back to documents"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {editingName ? (
              <input
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                onBlur={() => { setEditingName(false); saveDocument(); }}
                onKeyDown={(e) => { if (e.key === "Enter") { setEditingName(false); saveDocument(); } }}
                className="rounded border border-indigo-300 px-2 py-1 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                autoFocus
              />
            ) : (
              <button
                onClick={() => setEditingName(true)}
                className="text-sm font-medium text-gray-900 hover:text-indigo-600 transition-colors"
                title="Click to rename"
              >
                {docName}
              </button>
            )}

            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                doc.status === "FINAL" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {doc.status === "FINAL" ? "Final" : "Draft"}
            </span>

            {saving && <span className="text-xs text-gray-400">Saving...</span>}
            {saved && <span className="text-xs text-green-500">Saved</span>}
          </div>

          <div className="flex items-center gap-2">
            {/* Mode switcher */}
            <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
              {(["visual", "code", "preview"] as EditorMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    mode === m
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {m === "visual" ? "Visual" : m === "code" ? "Code" : "Preview"}
                </button>
              ))}
            </div>

            <div className="h-6 w-px bg-gray-200" />

            <button
              onClick={() => { flushVisualEditor(); setTimeout(() => saveDocument(), 400); }}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => { flushVisualEditor(); setTimeout(() => saveDocument(undefined, "FINAL"), 400); }}
              className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors"
            >
              Finalize
            </button>
            <button
              onClick={() => setShowVersions(!showVersions)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              title="Version history"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
              </svg>
            </button>
            <button
              onClick={exportHtml}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              title="Export HTML"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
            </button>
            <button
              onClick={printDocument}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              title="Print"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Editor area */}
      <div className="relative flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-hidden">
          {mode === "code" && (
            <CodeEditor value={html} onChange={handleHtmlChange} />
          )}
          {mode === "visual" && (
            <VisualEditor value={html} onChange={handleHtmlChange} />
          )}
          {mode === "preview" && (
            <div className="h-full overflow-auto bg-gray-100 p-4">
              <div className="mx-auto max-w-4xl rounded-lg bg-white shadow-sm">
                <iframe
                  srcDoc={html}
                  className="h-[calc(100vh-180px)] w-full"
                  sandbox="allow-same-origin"
                  title="Document preview"
                />
              </div>
            </div>
          )}
        </div>

        {/* Version history sidebar */}
        {showVersions && (
          <div className="w-72 border-l border-gray-200 bg-white overflow-y-auto">
            <div className="border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Version History</h3>
                <button
                  onClick={() => setShowVersions(false)}
                  className="rounded p-1 text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {doc.versions.length === 0 ? (
                <p className="p-4 text-sm text-gray-500">No versions yet</p>
              ) : (
                doc.versions.map((v) => (
                  <div key={v.id} className="p-4 hover:bg-gray-50">
                    <p className="text-xs text-gray-500">{new Date(v.createdAt).toLocaleString()}</p>
                    {v.comment && <p className="mt-1 text-xs text-gray-600">{v.comment}</p>}
                    <button
                      onClick={() => restoreVersion(v.id)}
                      className="mt-2 text-xs font-medium text-indigo-600 hover:text-indigo-500"
                    >
                      Restore this version
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
