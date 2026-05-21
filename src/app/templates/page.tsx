"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";

interface Template {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  version: number;
  isActive: boolean;
  createdAt: string;
  author: { name: string | null; email: string };
}

export default function TemplatesPage() {
  const { data: session } = useSession();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.json())
      .then((data) => {
        setTemplates(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const categories = [...new Set(templates.map((t) => t.category).filter(Boolean))] as string[];

  const filtered = templates.filter((t) => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.description || "").toLowerCase().includes(search.toLowerCase());
    const matchCategory = !categoryFilter || t.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  return (
    <div className="min-h-full">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Template Catalog</h1>
            <p className="mt-1 text-sm text-gray-500">Choose a template to create a new document</p>
          </div>
          {session?.user && (
            <Link
              href="/templates/upload"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
              Upload Template
            </Link>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
          />
          {categories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}
        </div>

        {loading ? (
          <div className="mt-16 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-16 text-center">
            <p className="text-gray-500">No templates found</p>
            {session?.user && (
              <Link href="/templates/upload" className="mt-2 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500">
                Upload the first template
              </Link>
            )}
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((template) => (
              <Link
                key={template.id}
                href={`/templates/${template.id}`}
                className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                      <path d="M14 2v6h6" />
                    </svg>
                  </div>
                  {template.category && (
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                      {template.category}
                    </span>
                  )}
                </div>
                <h3 className="mt-4 text-base font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                  {template.name}
                </h3>
                {template.description && (
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">{template.description}</p>
                )}
                <div className="mt-4 flex items-center gap-3 text-xs text-gray-400">
                  <span>v{template.version}</span>
                  <span>{new Date(template.createdAt).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
