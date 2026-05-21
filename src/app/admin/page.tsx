"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";

interface Template {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  version: number;
  isActive: boolean;
  createdAt: string;
}

export default function AdminPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  // Upload form state
  const [uploadName, setUploadName] = useState("");
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploadCategory, setUploadCategory] = useState("");
  const [uploadHtml, setUploadHtml] = useState("");
  const [uploadMode, setUploadMode] = useState<"paste" | "file">("file");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const fetchTemplates = useCallback(async () => {
    const res = await fetch("/api/templates");
    if (res.ok) setTemplates(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/auth/login");
      return;
    }
    if (session?.user) {
      fetchTemplates();
    }
  }, [session, authStatus, router, fetchTemplates]);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith(".html") || file.name.endsWith(".htm")) {
      const text = await file.text();
      setUploadHtml(text);
      if (!uploadName) setUploadName(file.name.replace(/\.(html|htm)$/, ""));
    }
  }

  async function submitTemplate(e: React.FormEvent) {
    e.preventDefault();
    setUploadError("");

    if (!uploadName.trim() || !uploadHtml.trim()) {
      setUploadError("Name and HTML content are required");
      return;
    }

    setUploading(true);
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: uploadName,
          description: uploadDesc || null,
          category: uploadCategory || null,
          html: uploadHtml,
        }),
      });

      if (res.ok) {
        setShowUpload(false);
        setUploadName("");
        setUploadDesc("");
        setUploadCategory("");
        setUploadHtml("");
        fetchTemplates();
      } else {
        const data = await res.json();
        setUploadError(data.error || "Failed to upload template");
      }
    } catch {
      setUploadError("Something went wrong");
    } finally {
      setUploading(false);
    }
  }

  async function toggleActive(id: string, currentlyActive: boolean) {
    await fetch(`/api/templates/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !currentlyActive }),
    });
    fetchTemplates();
  }

  async function deleteTemplate(id: string) {
    if (!confirm("Are you sure you want to delete this template? All associated documents will also be deleted.")) return;
    await fetch(`/api/templates/${id}`, { method: "DELETE" });
    fetchTemplates();
  }

  return (
    <div className="min-h-full">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            <p className="mt-1 text-sm text-gray-500">Manage templates and system settings</p>
          </div>
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
            Upload Template
          </button>
        </div>

        {/* Upload form */}
        {showUpload && (
          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Upload New Template</h2>
            <form onSubmit={submitTemplate} className="mt-4 space-y-4">
              {uploadError && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{uploadError}</div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Template Name *</label>
                  <input
                    type="text"
                    value={uploadName}
                    onChange={(e) => setUploadName(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    placeholder="e.g. Application Form"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <input
                    type="text"
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    placeholder="e.g. Forms, Letters, Applications"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={uploadDesc}
                  onChange={(e) => setUploadDesc(e.target.value)}
                  rows={2}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  placeholder="Brief description of the template"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">HTML Content *</label>
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setUploadMode("file")}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      uploadMode === "file"
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMode("paste")}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      uploadMode === "paste"
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Paste Code
                  </button>
                </div>

                {uploadMode === "file" ? (
                  <div className="relative">
                    <input
                      type="file"
                      accept=".html,.htm"
                      onChange={handleFileUpload}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                    {uploadHtml && (
                      <p className="mt-2 text-xs text-green-600">File loaded ({uploadHtml.length} characters)</p>
                    )}
                  </div>
                ) : (
                  <textarea
                    value={uploadHtml}
                    onChange={(e) => setUploadHtml(e.target.value)}
                    rows={10}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 font-mono text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    placeholder="<!doctype html>..."
                  />
                )}
              </div>

              {uploadHtml && (
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-2 text-sm font-medium text-gray-700">Preview</h3>
                  <iframe
                    srcDoc={uploadHtml}
                    className="h-64 w-full rounded border border-gray-100"
                    sandbox="allow-same-origin"
                    title="Upload preview"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowUpload(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {uploading ? "Uploading..." : "Upload Template"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Templates list */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900">All Templates</h2>
          {loading ? (
            <div className="mt-8 flex justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
            </div>
          ) : templates.length === 0 ? (
            <p className="mt-4 text-gray-500">No templates yet. Upload the first one!</p>
          ) : (
            <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
                    <th className="hidden px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:table-cell">Category</th>
                    <th className="hidden px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 md:table-cell">Version</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {templates.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{t.name}</td>
                      <td className="hidden px-6 py-4 text-sm text-gray-500 sm:table-cell">{t.category || "—"}</td>
                      <td className="hidden px-6 py-4 text-sm text-gray-500 md:table-cell">v{t.version}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            t.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {t.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => router.push(`/templates/${t.id}`)}
                            className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
                          >
                            Preview
                          </button>
                          <button
                            onClick={() => toggleActive(t.id, t.isActive)}
                            className="text-xs font-medium text-gray-600 hover:text-gray-500"
                          >
                            {t.isActive ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            onClick={() => deleteTemplate(t.id)}
                            className="text-xs font-medium text-red-600 hover:text-red-500"
                          >
                            Delete
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
    </div>
  );
}
