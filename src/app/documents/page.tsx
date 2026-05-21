"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";

interface Doc {
  id: string;
  name: string;
  status: "DRAFT" | "FINAL";
  createdAt: string;
  updatedAt: string;
  template: { name: string; category: string | null };
}

export default function DocumentsPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState<"updatedAt" | "createdAt" | "name">("updatedAt");

  const fetchDocuments = useCallback(async () => {
    const res = await fetch("/api/documents");
    if (res.ok) {
      const data = await res.json();
      setDocuments(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/auth/login");
      return;
    }
    if (session?.user) fetchDocuments();
  }, [session, authStatus, router, fetchDocuments]);

  async function deleteDoc(id: string) {
    if (!confirm("Are you sure you want to delete this document?")) return;
    await fetch(`/api/documents/${id}`, { method: "DELETE" });
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }

  async function duplicateDoc(id: string) {
    const res = await fetch(`/api/documents/${id}/duplicate`, { method: "POST" });
    if (res.ok) fetchDocuments();
  }

  async function exportHtml(id: string) {
    const res = await fetch(`/api/documents/${id}`);
    if (!res.ok) return;
    const doc = await res.json();
    const blob = new Blob([doc.html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc.name.replace(/\s+/g, "_")}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const filtered = documents
    .filter((d) => {
      const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.template.name.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !statusFilter || d.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return new Date(b[sortBy]).getTime() - new Date(a[sortBy]).getTime();
    });

  return (
    <div className="min-h-full">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Documents</h1>
            <p className="mt-1 text-sm text-gray-500">{documents.length} document(s)</p>
          </div>
          <button
            onClick={() => router.push("/templates")}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path d="M12 4v16m8-8H4" />
            </svg>
            New Document
          </button>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm outline-none"
          >
            <option value="">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="FINAL">Final</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm outline-none"
          >
            <option value="updatedAt">Last modified</option>
            <option value="createdAt">Date created</option>
            <option value="name">Name</option>
          </select>
        </div>

        {loading ? (
          <div className="mt-16 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-16 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            </svg>
            <p className="mt-4 text-gray-500">No documents found</p>
            <button
              onClick={() => router.push("/templates")}
              className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              Create your first document from a template
            </button>
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
                  <th className="hidden px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:table-cell">Template</th>
                  <th className="hidden px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 md:table-cell">Status</th>
                  <th className="hidden px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 lg:table-cell">Modified</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <button
                        onClick={() => router.push(`/editor/${doc.id}`)}
                        className="text-sm font-medium text-gray-900 hover:text-indigo-600 transition-colors text-left"
                      >
                        {doc.name}
                      </button>
                    </td>
                    <td className="hidden px-6 py-4 text-sm text-gray-500 sm:table-cell">{doc.template.name}</td>
                    <td className="hidden px-6 py-4 md:table-cell">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          doc.status === "FINAL"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {doc.status === "FINAL" ? "Final" : "Draft"}
                      </span>
                    </td>
                    <td className="hidden px-6 py-4 text-sm text-gray-500 lg:table-cell">
                      {new Date(doc.updatedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => router.push(`/editor/${doc.id}`)}
                          title="Edit"
                          className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => exportHtml(doc.id)}
                          title="Download HTML"
                          className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                          </svg>
                        </button>
                        <button
                          onClick={() => duplicateDoc(doc.id)}
                          title="Duplicate"
                          className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                        </button>
                        <button
                          onClick={() => deleteDoc(doc.id)}
                          title="Delete"
                          className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
