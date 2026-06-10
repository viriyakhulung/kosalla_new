"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useClientSession } from "@/hooks/useClientSession";

export default function NewManageUserArticlePage() {
  const router = useRouter();
  const { perms } = useClientSession();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  if (!perms.canCreate) {
    return (
      <main className="p-6">
        <div className="mx-auto max-w-3xl rounded-xl border bg-white p-6">
          <h1 className="text-lg font-semibold">Unauthorized</h1>
          <p className="mt-2 text-sm text-slate-600">can_create=false</p>
        </div>
      </main>
    );
  }

  async function save() {
    if (!title.trim()) return alert("Title wajib diisi");
    if (!content.trim()) return alert("Content wajib diisi");

    setSaving(true);
    try {
      const json: any = await apiFetch(`/portal/user-articles`, {
        method: "POST",
        body: JSON.stringify({ title: title.trim(), content }),
      });

      const id = json?.id ?? json?.data?.id;
      if (!id) {
        router.push("/portal/manage/user-articles");
        return;
      }
      router.push(`/portal/manage/user-articles/${id}`);
    } catch (e: any) {
      alert(e?.message ?? "Gagal create artikel");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="p-6">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Create Article</h1>
            <p className="text-sm text-slate-600">Simpan draft dulu.</p>
          </div>

          <div className="flex gap-2">
            <button
              className="rounded-lg border bg-white px-3 py-2 text-sm hover:bg-slate-50"
              onClick={() => router.push("/portal/manage/user-articles")}
              disabled={saving}
            >
              Back
            </button>
            <button
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-60"
              onClick={save}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Draft"}
            </button>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm space-y-3">
          <div>
            <label className="text-sm font-medium text-slate-700">Title</label>
            <input
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Content</label>
            <textarea
              className="mt-1 w-full min-h-[300px] rounded-lg border px-3 py-2 text-sm"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
