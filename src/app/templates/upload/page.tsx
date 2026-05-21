"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";

export default function UploadTemplatePage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [html, setHtml] = useState("");
  const [uploadMode, setUploadMode] = useState<"file" | "paste">("file");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  if (authStatus === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  if (authStatus === "unauthenticated" || !session?.user) {
    router.push("/auth/login");
    return null;
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.name.endsWith(".html") || file.name.endsWith(".htm")) {
      file.text().then((text) => {
        setHtml(text);
        if (!name) setName(file.name.replace(/\.(html|htm)$/, ""));
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim() || !html.trim()) {
      setError("Name and HTML content are required");
      return;
    }

    setUploading(true);
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          category: category.trim() || null,
          html,
        }),
      });

      if (res.ok) {
        router.push("/templates");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to upload template");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="min-h-full">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <button
          onClick={() => router.back()}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Upload Template</h1>
              <p className="text-sm text-gray-500">Upload an HTML file or paste code to create a new template</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Template Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. Application Form"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  placeholder="e.g. Forms, Letters, Contracts"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                placeholder="Brief description of the template"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                HTML Content <span className="text-red-500">*</span>
              </label>
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
                <div>
                  <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 p-8 text-center hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors">
                    <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12H9.75m3 0-3-3m3 3 3-3M8.25 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                    <span className="text-sm text-gray-500">
                      {html ? "File loaded — click to replace" : "Click to select an HTML file"}
                    </span>
                    <span className="text-xs text-gray-400">.html or .htm files</span>
                    <input
                      type="file"
                      accept=".html,.htm"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  {html && (
                    <p className="mt-2 text-xs text-green-600">
                      File loaded ({html.length.toLocaleString()} characters)
                    </p>
                  )}
                </div>
              ) : (
                <textarea
                  value={html}
                  onChange={(e) => setHtml(e.target.value)}
                  rows={12}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 font-mono text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  placeholder="<!DOCTYPE html>&#10;<html>&#10;  <head>...</head>&#10;  <body>...</body>&#10;</html>"
                />
              )}
            </div>

            {html && (
              <div className="rounded-lg border border-gray-200 p-4">
                <h3 className="mb-2 text-sm font-medium text-gray-700">Preview</h3>
                <iframe
                  srcDoc={html}
                  className="h-72 w-full rounded border border-gray-100"
                  sandbox="allow-same-origin"
                  title="Template preview"
                />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.back()}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Upload Template"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
