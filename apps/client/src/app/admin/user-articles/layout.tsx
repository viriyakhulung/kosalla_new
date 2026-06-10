"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/auth";

export default function AdminUserArticlesLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const doLogout = async () => {
    await logout().catch(() => {});
    router.replace("/login");
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-6">
      <div className="mx-auto max-w-6xl space-y-4">
        {/* HEADER */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">User Articles</h1>
            <div className="text-sm text-slate-600">Admin Module • Access</div>
          </div>

          <div className="flex gap-2">
            <button
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50"
              onClick={() => router.push("/admin")}
            >
              ← Back
            </button>

            <button
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50"
              onClick={doLogout}
            >
              🚪 Logout
            </button>
          </div>
        </div>

        {/* TAB BAR (ONLY ACCESS) */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
            <span className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white">
              Access
            </span>
          </div>
        </div>

        {children}
      </div>
    </main>
  );
}
