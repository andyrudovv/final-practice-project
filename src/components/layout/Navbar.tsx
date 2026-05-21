"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export default function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-indigo-600">
          <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
            <path d="M14 2v6h6" />
            <path d="M16 13H8" />
            <path d="M16 17H8" />
            <path d="M10 9H8" />
          </svg>
          DocTemplate
        </Link>

        {session?.user ? (
          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-4 sm:flex">
              <Link href="/templates" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Templates
              </Link>
              <Link href="/documents" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                My Documents
              </Link>
              {(session.user as { role?: string }).role === "ADMIN" && (
                <Link href="/admin" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                  Admin
                </Link>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
              >
                <span className="hidden sm:inline">{session.user.name || session.user.email}</span>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {menuOpen && (
                <div className="absolute right-0 z-50 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                  <div className="border-b border-gray-100 px-4 py-2 sm:hidden">
                    <p className="text-sm font-medium">{session.user.name || session.user.email}</p>
                  </div>
                  <Link href="/templates" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 sm:hidden" onClick={() => setMenuOpen(false)}>
                    Templates
                  </Link>
                  <Link href="/documents" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 sm:hidden" onClick={() => setMenuOpen(false)}>
                    My Documents
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Sign In
            </Link>
            <Link
              href="/auth/register"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
