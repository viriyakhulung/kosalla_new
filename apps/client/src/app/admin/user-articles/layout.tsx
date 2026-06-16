"use client";

import React from "react";
import { Newspaper } from "lucide-react";
import { PageHead } from "@/components/admin/ui";

export default function AdminUserArticlesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <PageHead
        icon={<Newspaper className="size-5" />}
        title="User Articles"
        subtitle="Workflow author → review → publish · atur akses user internal"
      />

      {/* TAB BAR (ONLY ACCESS) */}
      <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
        <span className="rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white">Access</span>
      </div>

      {children}
    </div>
  );
}
