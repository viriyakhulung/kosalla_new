"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useClientSession } from "@/hooks/useClientSession";

type UserArticle = {
  id: number;
  title: string;
  status?: string | null;
  product_name?: string | null;
  organization_name?: string | null;
  author_email?: string | null;
  author?: { email?: string | null } | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type Paginated<T> = {
  data: T[];
  current_page?: number;
  per_page?: number;
  total?: number;
};

function fmtDate(iso?: string | null) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function ManageUserArticlesPage() {
  const router = useRouter();
  const { loading: sessLoading, perms, user } = useClientSession();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rows, setRows] = useState<UserArticle[]>([]);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams();
      qs.set("per_page", "20");
      if (q.trim()) qs.set("q", q.trim());
      if (status !== "all") qs.set("status", status);

      const json = await apiFetch<Paginated<UserArticle>>(`/portal/user-articles?${qs.toString()}`);
      setRows(json?.data ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Gagal load user articles");
    } finally {
      setLoading(false);
    }
  }

  async function publish(id: number) {
    if (!perms.canPublish) return;
    if (!confirm("Publish artikel ini?")) return;
    try {
      await apiFetch(`/portal/user-articles/${id}/publish`, { method: "POST" });
      await load();
    } catch (e: any) {
      alert(e?.message ?? "Gagal publish");
    }
  }

  // Submit review hanya untuk creator yang TIDAK punya publish right
  async function submitReview(id: number) {
    if (!perms.canCreate || perms.canPublish) return;
    if (!confirm("Submit artikel ini untuk review?")) return;
    try {
      await apiFetch(`/portal/user-articles/${id}/submit-review`, { method: "POST" });
      await load();
    } catch (e: any) {
      alert(e?.message ?? "Gagal submit review");
    }
  }

  useEffect(() => {
    if (sessLoading) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessLoading]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (!qq) return true;
      const author = (r.author_email ?? r.author?.email ?? "").toLowerCase();
      return r.title?.toLowerCase().includes(qq) || author.includes(qq) || String(r.id).includes(qq);
    });
  }, [rows, q]);

  return (
    <main className="p-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">User Articles</h1>
            <p className="text-sm text-slate-600">
              Portal Manage (Viriyastaff). Tombol muncul sesuai can_create/can_review/can_publish.
            </p>
          </div>

          <div className="flex gap-2">
            {perms.canReview && (
              <Link
                href="/portal/manage/user-articles/reviewer"
                className="rounded-lg border bg-white px-3 py-2 text-sm hover:bg-slate-50"
              >
                Reviewer Queue
              </Link>
            )}

            {perms.canCreate && (
              <button
                className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-800"
                onClick={() => router.push("/portal/manage/user-articles/new")}
              >
                Create Article
              </button>
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:flex-wrap">
            <input
              className="w-full md:w-[320px] rounded-lg border px-3 py-2 text-sm"
              placeholder="Search title / author email"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />

            <select
              className="w-full md:w-[180px] rounded-lg border px-3 py-2 text-sm bg-white"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="review">In Review</option>
              <option value="published">Published</option>
            </select>

            <button
              className="rounded-lg border bg-white px-3 py-2 text-sm hover:bg-slate-50"
              onClick={load}
              disabled={loading}
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <div className="border-b px-4 py-3 text-sm font-semibold">
            Articles ({filtered.length})
          </div>

          {error && (
            <div className="p-4 text-sm text-red-700 bg-red-50 border-b border-red-200">
              {error}
            </div>
          )}

          {loading ? (
            <div className="p-6 text-sm text-slate-600">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-sm text-slate-600">Belum ada artikel.</div>
          ) : (
            <div className="w-full overflow-auto">
              <table className="min-w-[980px] w-full text-sm">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="text-left px-4 py-3">Title</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">Author</th>
                    <th className="text-left px-4 py-3">Updated</th>
                    <th className="text-right px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-t hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium">{r.title}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full border px-2 py-0.5 text-xs">
                          {r.status ?? "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3">{r.author_email ?? r.author?.email ?? "-"}</td>
                      <td className="px-4 py-3">{fmtDate(r.updated_at ?? r.created_at)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex flex-wrap justify-end gap-2">
                          <Link
                            href={`/portal/manage/user-articles/${r.id}`}
                            className="rounded-lg border bg-white px-3 py-1.5 text-xs hover:bg-slate-50"
                          >
                            View
                          </Link>

                          {/* Submit Review: hanya can_create true & can_publish false */}
                          {perms.canCreate && !perms.canPublish && (r.status === "draft" || !r.status) && (
                            <button
                              className="rounded-lg border bg-white px-3 py-1.5 text-xs hover:bg-slate-50"
                              onClick={() => submitReview(r.id)}
                            >
                              Submit Review
                            </button>
                          )}

                          {/* Publish: hanya can_publish */}
                          {perms.canPublish && (r.status === "draft" || r.status === "review") && (
                            <button
                              className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs text-white hover:bg-slate-800"
                              onClick={() => publish(r.id)}
                            >
                              Publish
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="text-xs text-slate-500">
          {user?.email ?? "-"} | can_create={String(perms.canCreate)} can_review={String(perms.canReview)} can_publish={String(perms.canPublish)}
        </div>
      </div>
    </main>
  );
}
