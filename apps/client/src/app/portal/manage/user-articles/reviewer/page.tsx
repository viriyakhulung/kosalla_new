"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useClientSession } from "@/hooks/useClientSession";

type Row = {
  id: number;
  title: string;
  author_email?: string | null;
  updated_at?: string | null;
};

type Paginated<T> = { data: T[] };

const ENDPOINTS = {
  queue: [
    "/portal/user-articles/reviewer-queue",
    "/portal/user-articles/reviewer/queue",
  ],
  approve: (id: number) => [
    `/portal/user-articles/${id}/approve`,
    `/portal/user-articles/${id}/review/approve`,
  ],
  reject: (id: number) => [
    `/portal/user-articles/${id}/reject`,
    `/portal/user-articles/${id}/review/reject`,
  ],
};

async function apiFetchFirst<T>(paths: string[], options?: RequestInit) {
  let lastErr: any = null;
  for (const p of paths) {
    try {
      return await apiFetch<T>(p, options);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error("No endpoint matched");
}

export default function ReviewerQueuePage() {
  const { perms } = useClientSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rows, setRows] = useState<Row[]>([]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const json = await apiFetchFirst<Paginated<Row>>(ENDPOINTS.queue, { method: "GET" });
      setRows(json?.data ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Gagal load reviewer queue (cek ENDPOINTS.queue)");
    } finally {
      setLoading(false);
    }
  }

  async function approve(id: number) {
    if (!confirm("Approve artikel ini?")) return;
    try {
      await apiFetchFirst(ENDPOINTS.approve(id), { method: "POST" });
      await load();
    } catch (e: any) {
      alert(e?.message ?? "Gagal approve");
    }
  }

  async function reject(id: number) {
    if (!confirm("Reject artikel ini?")) return;
    try {
      await apiFetchFirst(ENDPOINTS.reject(id), { method: "POST" });
      await load();
    } catch (e: any) {
      alert(e?.message ?? "Gagal reject");
    }
  }

  useEffect(() => {
    if (!perms.canReview) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perms.canReview]);

  if (!perms.canReview) {
    return (
      <main className="p-6">
        <div className="mx-auto max-w-3xl rounded-xl border bg-white p-6">
          <h1 className="text-lg font-semibold">Unauthorized</h1>
          <p className="mt-2 text-sm text-slate-600">Reviewer Queue hanya untuk can_review=true.</p>
          <Link
            href="/portal/manage/user-articles"
            className="mt-4 inline-flex rounded-lg border bg-white px-3 py-2 text-sm hover:bg-slate-50"
          >
            Back
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="p-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Reviewer Queue</h1>
            <p className="text-sm text-slate-600">Approve/Reject hanya untuk reviewer.</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/portal/manage/user-articles"
              className="rounded-lg border bg-white px-3 py-2 text-sm hover:bg-slate-50"
            >
              Back
            </Link>
            <button
              className="rounded-lg border bg-white px-3 py-2 text-sm hover:bg-slate-50"
              onClick={load}
            >
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <div className="border-b px-4 py-3 text-sm font-semibold">
            Need Review ({rows.length})
          </div>

          {loading ? (
            <div className="p-6 text-sm text-slate-600">Loading...</div>
          ) : rows.length === 0 ? (
            <div className="p-6 text-sm text-slate-600">Tidak ada artikel untuk direview.</div>
          ) : (
            <div className="w-full overflow-auto">
              <table className="min-w-[980px] w-full text-sm">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="text-left px-4 py-3">Title</th>
                    <th className="text-left px-4 py-3">Author</th>
                    <th className="text-left px-4 py-3">Updated</th>
                    <th className="text-right px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-t hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium">{r.title}</td>
                      <td className="px-4 py-3">{r.author_email ?? "-"}</td>
                      <td className="px-4 py-3">{r.updated_at ?? "-"}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex gap-2">
                          <Link
                            href={`/portal/manage/user-articles/${r.id}`}
                            className="rounded-lg border bg-white px-3 py-1.5 text-xs hover:bg-slate-50"
                          >
                            View
                          </Link>
                          <button
                            className="rounded-lg border bg-white px-3 py-1.5 text-xs hover:bg-slate-50"
                            onClick={() => reject(r.id)}
                          >
                            Reject
                          </button>
                          <button
                            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs text-white hover:bg-slate-800"
                            onClick={() => approve(r.id)}
                          >
                            Approve
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
    </main>
  );
}
