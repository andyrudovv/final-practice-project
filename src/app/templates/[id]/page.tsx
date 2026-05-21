"use client";

import { useEffect, useState, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";

interface Template {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  html: string;
  css: string | null;
  js: string | null;
  version: number;
  createdAt: string;
  authorId: string;
  author: { name: string | null; email: string };
}

export default function TemplatePreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const router = useRouter();
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch(`/api/templates/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setTemplate(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  async function createDocument() {
    if (!session?.user || !template) return;
    setCreating(true);

    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${template.name} - New Document`,
          templateId: template.id,
          html: template.html,
        }),
      });

      const doc = await res.json();
      if (res.ok) {
        router.push(`/editor/${doc.id}`);
      }
    } catch {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-full">
        <Navbar />
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-full">
        <Navbar />
        <div className="py-20 text-center text-gray-500">Template not found</div>
      </div>
    );
  }

  const fullHtml = template.css
    ? template.html.replace("</head>", `<style>${template.css}</style></head>`)
    : template.html;

  return (
    <div className="min-h-full">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/templates" className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path d="M15 19l-7-7 7-7" />
          </svg>
          Back to catalog
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{template.name}</h1>
            {template.description && (
              <p className="mt-2 text-gray-600">{template.description}</p>
            )}
            <div className="mt-3 flex items-center gap-4 text-sm text-gray-400">
              {template.category && (
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                  {template.category}
                </span>
              )}
              <span>Version {template.version}</span>
              <span>by {template.author.name || template.author.email}</span>
              <span>{new Date(template.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {session?.user ? (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={createDocument}
                disabled={creating}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path d="M12 4v16m8-8H4" />
                </svg>
                {creating ? "Creating..." : "Create Document"}
              </button>
              {(template.authorId === session.user.id ||
                (session.user as { role?: string }).role === "ADMIN") && (
                <button
                  onClick={async () => {
                    if (!confirm("Delete this template? All documents based on it will also be removed.")) return;
                    const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
                    if (res.ok) router.push("/templates");
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              )}
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shrink-0"
            >
              Sign in to use template
            </Link>
          )}
        </div>

        <div className="mt-8 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
            <h3 className="text-sm font-medium text-gray-700">Preview</h3>
          </div>
          <div className="p-4">
            <iframe
              srcDoc={fullHtml}
              className="h-[700px] w-full rounded border border-gray-100"
              sandbox="allow-same-origin"
              title="Template preview"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
