import Link from "next/link";
import Navbar from "@/components/layout/Navbar";

export default function HomePage() {
  return (
    <div className="min-h-full">
      <Navbar />

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50" />
          <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
                HTML Document
                <span className="block text-indigo-600">Template Platform</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
                Upload HTML templates, fill them with data, edit visually or in code,
                save and export your documents — all in one place.
              </p>
              <div className="mt-10 flex items-center justify-center gap-4">
                <Link
                  href="/auth/register"
                  className="rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-md hover:bg-indigo-700 transition-all hover:shadow-lg"
                >
                  Get Started
                </Link>
                <Link
                  href="/templates"
                  className="rounded-xl border border-gray-300 bg-white px-8 py-3.5 text-base font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-all"
                >
                  Browse Templates
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Upload Templates",
                desc: "Upload your HTML document templates or choose from existing ones in the catalog.",
                icon: (
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                ),
              },
              {
                title: "Fill & Edit",
                desc: "Fill form fields, edit content visually with drag-and-drop, or switch to code mode.",
                icon: (
                  <>
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </>
                ),
              },
              {
                title: "Save & Export",
                desc: "Save drafts, finalize documents, and export as HTML or print directly from browser.",
                icon: (
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8" />
                ),
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                    {feature.icon}
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
