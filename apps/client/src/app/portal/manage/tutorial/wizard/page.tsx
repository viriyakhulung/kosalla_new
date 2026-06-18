"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import TutorialWizard from "../new/TutorialWizard";

export default function TutorialWizardPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Wizard Knowledge Base</h2>
          <p className="mt-0.5 text-sm text-slate-500">Pembuatan terpandu: Konten → Review</p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/portal/manage/tutorial")}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
        >
          <ArrowLeft className="size-4" />
          Back
        </button>
      </div>

      <TutorialWizard />
    </div>
  );
}
