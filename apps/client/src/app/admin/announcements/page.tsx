"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { logout } from "@/lib/auth";
import { apiFetch } from "@/lib/api";

type Product = { id: number; name: string };
type Paginated<T> = {
  data: T[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
};

type Announcement = {
  id: number;
  scope: "global" | "product";
  product_id: number | null;
  product_name?: string | null;
  title: string;
  body_html?: string;
  status: string; // tetap ada di DB, tapi selalu published
  starts_at: string | null;
  ends_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

type AdminProductsResponse = Product[] | { data?: Product[] };

function parseProducts(json: AdminProductsResponse): Product[] {
  if (Array.isArray(json)) return json;
  return json?.data ?? [];
}

function fmtDayDate(ts?: string | null) {
  if (!ts) return "-";
  const d = new Date(ts);
  // Bahasa Indonesia: "Jumat, 13 Februari 2026"
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d);
}

function buildQuery(params: Record<string, any>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    sp.set(k, String(v));
  });
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export default function AdminAnnouncementsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<number>(Number(searchParams.get("page") || "1"));
  const [perPage, setPerPage] = useState<number>(Number(searchParams.get("per_page") || "20"));
  const [q, setQ] = useState<string>(searchParams.get("q") || "");
  const [scope, setScope] = useState<string>(searchParams.get("scope") || "");
  const [productId, setProductId] = useState<string>(searchParams.get("product_id") || "");

  const [data, setData] = useState<Paginated<Announcement> | null>(null);
  const [err, setErr] = useState<string>("");

  const queryString = useMemo(() => {
    return buildQuery({ page, per_page: perPage, q, scope, product_id: productId });
  }, [page, perPage, q, scope, productId]);

  const doLogout = async () => {
    await logout().catch(() => {});
    router.replace("/login");
  };

  async function loadProducts() {
    setLoadingProducts(true);
    try {
      const json = await apiFetch<AdminProductsResponse>("/admin/master-products");
      setProducts(parseProducts(json));
    } finally {
      setLoadingProducts(false);
    }
  }

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const json = await apiFetch<Paginated<Announcement>>(`/admin/announcements${queryString}`);
      setData(json);
      // sync url
      router.replace(`/admin/announcements${queryString}`);
    } catch (e: any) {
      setErr(e?.message || "Gagal load announcements");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString]);

  const canPrev = (data?.current_page ?? 1) > 1;
  const canNext = (data?.current_page ?? 1) < (data?.last_page ?? 1);

  async function onDelete(id: number) {
    if (!confirm("Hapus announcement ini?")) return;
    try {
      await apiFetch(`/admin/announcements/${id}`, { method: "DELETE" });
      await load();
    } catch (e: any) {
      alert(e?.message || "Gagal delete");
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Announcements</h1>
            <div className="text-sm text-slate-600">Admin Module (publish langsung)</div>
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

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-end gap-3 justify-between">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 w-full">
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-600">Search</label>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Cari title/body..."
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Scope</label>
                <select
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                >
                  <option value="">All</option>
                  <option value="global">Global</option>
                  <option value="product">Product</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Product</label>
                <select
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  disabled={loadingProducts}
                >
                  <option value="">All</option>
                  {products.map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50"
                onClick={() => {
                  setPage(1);
                  load().catch(() => {});
                }}
              >
                Refresh
              </button>

              <Link
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                href="/admin/announcements/new"
              >
                ➕ Create
              </Link>
            </div>
          </div>

          {err ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>
          ) : null}

          <div className="overflow-auto rounded-xl border border-slate-200">
            <table className="min-w-[980px] w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-slate-600">
                  <th className="px-4 py-3">Day / Date</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">Window</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="px-4 py-6 text-slate-500" colSpan={5}>
                      Loading...
                    </td>
                  </tr>
                ) : (data?.data?.length ?? 0) === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-slate-500" colSpan={5}>
                      Tidak ada data.
                    </td>
                  </tr>
                ) : (
                  data!.data.map((a) => (
                    <tr key={a.id} className="border-t border-slate-100">
                      <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                        {fmtDayDate(a.published_at || a.created_at)}
                      </td>
                      <td className="px-4 py-3 text-slate-900 font-medium">
                        <div className="line-clamp-2">{a.title}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {a.scope === "global" ? (
                          <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                            Global
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                            {a.product_name || `Product #${a.product_id}`}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        <div className="text-xs">
                          <div>Start: {a.starts_at ? new Date(a.starts_at).toLocaleString("id-ID") : "-"}</div>
                          <div>End: {a.ends_at ? new Date(a.ends_at).toLocaleString("id-ID") : "-"}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex gap-2">
                          <Link
                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs hover:bg-slate-50"
                            href={`/admin/announcements/${a.id}/edit`}
                          >
                            Edit
                          </Link>
                          <button
                            className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs text-red-700 hover:bg-red-50"
                            onClick={() => onDelete(a.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {data ? (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                Page {data.current_page} / {data.last_page} • Total {data.total}
              </div>

              <div className="flex gap-2 items-center">
                <label className="text-xs text-slate-600">Per page</label>
                <select
                  className="rounded-lg border border-slate-300 px-2 py-1 text-xs bg-white"
                  value={String(perPage)}
                  onChange={(e) => {
                    setPerPage(Number(e.target.value));
                    setPage(1);
                  }}
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>

                <button
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs disabled:opacity-50"
                  disabled={!canPrev}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </button>
                <button
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs disabled:opacity-50"
                  disabled={!canNext}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
