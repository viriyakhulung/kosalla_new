"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useClientSession } from "@/hooks/useClientSession";

type Row = {
  id: number;
  title: string;
  content?: string | null;
  status?: string | null;
  author_email?: string | null;
  author?: { email?: string | null } | null;
};

export default function ManageUserArticleDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

  const { perms, user } = useClientSession();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [row, setRow] = useState<Row | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  const isAuthor = useMemo(() => {
    const my = (user?.email ?? "").toLowerCase();
    const au = (row?.author_email ?? row?.author?.email ?? "").toLowerCase();
    return Boolean(my && au && my === au);
  }, [user?.email, row?.author_email, row?.author?.email]);

  const canEditDraft = perms.canCreate && isAuthor && (row?.status === "draft" || !row?.status);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const json = await apiFetch<Row>(`/portal/user-articles/${id}`);
      setRow(json);
      setTitle(json?.title ?? "");
      setContent(json?.content ?? "");
    } catch (e: any) {
      setError(e?.message ?? "Gagal load detail");
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!canEditDraft) return;
    if (!title.trim()) return alert("Title wajib diisi");
    if (!content.trim()) return alert("Content wajib diisi");

    setSaving(true);
    try {
      await apiFetch(`/portal/user-articles/${id}`, {
        method: "PUT",
        body: JSON.stringify({ title: title.trim(), content }),
      });
      await load();
    } catch (e: any) {
      alert(e?.message ?? "Gagal save");
    } finally {
      setSaving(false);
    }
  }

  async function submitReview() {
    if (!perms.canCreate || perms.canPublish) return;
    if (!confirm("Submit artikel ini untuk review?")) return;
    try {
      await apiFetch(`/portal/user-articles/${id}/submit-review`, { method: "POST" });
      await load();
    } catch (e: any) {
      alert(e?.message ?? "Gagal submit review");
    }
  }

  async function publish() {
    if (!perms.canPublish) return;
    if (!confirm("Publish artikel ini?")) return;
    try {
      await apiFetch(`/portal/user-articles/${id}/publish`, { method: "POST" });
      await load();
    } catch (e: any) {
      alert(e?.message ?? "Gagal publish");
    }
  }

  useEffect(() => {
    if (!Number.isFinite(id)) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <main className="p-6">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Article Detail</h1>
            <p className="text-sm text-slate-600">
              Status: <span className="font-semibold">{row?.status ?? "-"}</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-lg border bg-white px-3 py-2 text-sm hover:bg-slate-50"
              onClick={() => router.push("/portal/manage/user-articles")}
              disabled={saving}
            >
              Back
            </button>

            {canEditDraft && (
              <button
                className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800 disabled:opacity-60"
                onClick={save}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            )}

            {perms.canCreate && !perms.canPublish && (row?.status === "draft" || !row?.status) && (
              <button
                className="rounded-lg border bg-white px-3 py-2 text-sm hover:bg-slate-50"
                onClick={submitReview}
              >
                Submit Review
              </button>
            )}

            {perms.canPublish && (row?.status === "draft" || row?.status === "review") && (
              <button
                className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800"
                onClick={publish}
              >
                Publish
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border bg-white p-6 text-sm text-slate-600">Loading...</div>
        ) : !row ? (
          <div className="rounded-xl border bg-white p-6 text-sm text-slate-600">Not found.</div>
        ) : (
          <div className="rounded-xl border bg-white p-5 shadow-sm space-y-3">
            <div>
              <label className="text-sm font-medium text-slate-700">Title</label>
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm disabled:bg-slate-50"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={!canEditDraft}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Content</label>
              <textarea
                className="mt-1 w-full min-h-[320px] rounded-lg border px-3 py-2 text-sm disabled:bg-slate-50"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={!canEditDraft}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
