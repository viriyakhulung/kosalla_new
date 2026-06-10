"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, RotateCcw, Plus, FileText, ChevronRight, Loader2, BookOpen } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useClientSession } from "@/hooks/useClientSession";

type Product = { id: number; name: string };
type MasterProductsResp = { data: Product[] };

type ArticleRow = {
  id: number;

  organization_id?: number | null;
  organization_name?: string | null;

  product_id: number;
  product_name?: string | null;

  title: string;
  status: string;

  reviewer_id?: number | null;

  submitted_at?: string | null;
  reviewed_at?: string | null;
  rejected_at?: string | null;
  published_at?: string | null;

  updated_at?: string | null;

  created_by?: number | null;
  created_by_email?: string | null;

  // ✅ NEW
  published_by_email?: string | null;
};

type Paginated<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

function fmt(dt?: string | null) {
  if (!dt) return "-";
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return dt;
  }
}

function workflowLabel(a: ArticleRow) {
  const s = String(a.status ?? "").toLowerCase();
  if (s === "draft") return "draft";
  if (s === "rejected") return "rejected";
  if (s === "published") return "published";

  if (s === "review") {
    if (a.reviewed_at && !a.published_at) return "approved";
    return "review";
  }

  return s || "unknown";
}

function badgeClass(label: string) {
  const s = label.toLowerCase();
  if (s === "draft") return "bg-slate-100 text-slate-700";
  if (s === "review") return "bg-amber-100 text-amber-800";
  if (s === "approved") return "bg-blue-100 text-blue-700";
  if (s === "published") return "bg-green-100 text-green-700";
  if (s === "rejected") return "bg-red-100 text-red-700";
  return "bg-slate-100 text-slate-700";
}

/* ─── Pill button ─────────────────────────────────────────────────────── */
function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors",
        active
          ? "border-teal-600 bg-teal-600 text-white shadow-sm"
          : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
      )}
    >
      {children}
    </button>
  );
}

export default function ManageUserArticlesPage() {
  const router = useRouter();
  const { perms } = useClientSession();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<ArticleRow[]>([]);

  // ✅ search input (debounced)
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState(""); // debounced value

  const [productId, setProductId] = useState<number | "">("");

  // view:
  const [view, setView] = useState<
    "mine" | "org_drafts" | "org_all" | "review_queue" | "my_reviews" | "ready_publish"
  >("mine");

  // status tab:
  const [tab, setTab] = useState<"all" | "draft" | "review" | "published" | "rejected">("all");

  // ✅ FIX #1: default Show = 10
  const [perPage, setPerPage] = useState(10);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRows, setTotalRows] = useState(0);

  // ✅ FIX #2: request guard (hindari response lama overwrite)
  const reqIdRef = useRef(0);

  // ✅ default view:
  // kalau internal (reviewer/publisher) → langsung masuk Org Articles biar bisa lihat semua
  useEffect(() => {
    if (perms.canReview || perms.canPublish) setView("org_all");
    else if (perms.canCreate) setView("mine");
  }, [perms.canCreate, perms.canReview, perms.canPublish]);

  // debounce search input -> q
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setQ(qInput.trim());
    }, 350);
    return () => clearTimeout(t);
  }, [qInput]);

  async function loadProducts() {
    try {
      const mp = await apiFetch<MasterProductsResp>("/portal/master-products");
      setProducts(mp?.data ?? []);
    } catch {
      setProducts([]);
    }
  }

  async function loadList() {
    const myReq = ++reqIdRef.current;

    setLoading(true);
    setError("");

    try {
      const qs = new URLSearchParams();
      qs.set("per_page", String(perPage));
      qs.set("page", String(page));

      if (productId !== "") qs.set("product_id", String(productId));
      if (q) qs.set("q", q);

      let endpoint = "";

      // ✅ pakai else-if biar jelas hanya 1 branch
      if (view === "mine") {
        qs.set("mine", "1");
        if (tab !== "all") qs.set("status", tab);
        endpoint = `/portal/user-articles?${qs.toString()}`;
      } else if (view === "org_drafts") {
        qs.set("org_drafts", "1");
        if (tab === "draft" || tab === "rejected") qs.set("status", tab);
        endpoint = `/portal/user-articles?${qs.toString()}`;
      } else if (view === "org_all") {
        qs.set("org_all", "1");
        if (tab !== "all") qs.set("status", tab);
        endpoint = `/portal/user-articles?${qs.toString()}`;
      } else if (view === "review_queue") {
        endpoint = `/portal/user-articles/review/queue?${qs.toString()}`;
      } else if (view === "my_reviews") {
        qs.set("reviewed_by_me", "1");
        endpoint = `/portal/user-articles?${qs.toString()}`;
      } else if (view === "ready_publish") {
        qs.set("ready_publish", "1");
        endpoint = `/portal/user-articles?${qs.toString()}`;
      }

      const json = await apiFetch<Paginated<ArticleRow>>(endpoint);

      // ✅ ignore stale response
      if (myReq !== reqIdRef.current) return;

      setItems(json?.data ?? []);
      setTotalPages(json?.last_page ?? 1);
      setTotalRows(json?.total ?? 0);
    } catch (e: any) {
      if (myReq !== reqIdRef.current) return;

      setError(e?.message ?? "Gagal load artikel");
      setItems([]);
      setTotalPages(1);
      setTotalRows(0);
    } finally {
      if (myReq !== reqIdRef.current) return;
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Single source of truth: reload setiap query state berubah (tanpa double fetch)
  useEffect(() => {
    // saat pindah ke org_drafts, paksa tab valid
    if (view === "org_drafts") {
      if (tab !== "all" && tab !== "draft" && tab !== "rejected") {
        setTab("draft");
        setPage(1);
        return; // tunggu state update, effect akan jalan lagi
      }
    }

    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage, tab, productId, view, q]);

  const filteredClient = useMemo(() => {
    // NOTE: server sudah filter; ini hanya safety
    let arr = items;

    if (productId !== "") {
      arr = arr.filter((x) => Number(x.product_id) === Number(productId));
    }

    const qq = q.trim().toLowerCase();
    if (qq) {
      arr = arr.filter((x) => String(x.title ?? "").toLowerCase().includes(qq));
    }

    return arr;
  }, [items, productId, q]);

  const showMine = perms.canCreate;
  const showOrgDrafts = perms.canReview || perms.canPublish;
  const showOrgAll = perms.canReview || perms.canPublish;
  const showReviewQueue = perms.canReview;
  const showMyReviews = perms.canReview;
  const showReadyPublish = perms.canPublish;

  const openReturn = `/portal/manage/tutorial`;

  const dateColLabel =
    view === "review_queue"
      ? "Submitted"
      : view === "ready_publish"
      ? "Reviewed"
      : view === "my_reviews"
      ? "Reviewed/Rejected"
      : "Updated";

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {/* View switch */}
      <div className="flex flex-wrap items-center gap-2">
        {showMine && (
          <Pill active={view === "mine"} onClick={() => { setView("mine"); setPage(1); }}>
            My Articles
          </Pill>
        )}
        {showOrgDrafts && (
          <Pill active={view === "org_drafts"} onClick={() => { setView("org_drafts"); setPage(1); }}>
            Viriya Drafts
          </Pill>
        )}
        {showOrgAll && (
          <Pill active={view === "org_all"} onClick={() => { setView("org_all"); setPage(1); }}>
            Org Articles
          </Pill>
        )}
        {showReviewQueue && (
          <Pill active={view === "review_queue"} onClick={() => { setView("review_queue"); setPage(1); }}>
            Review Queue
          </Pill>
        )}
        {showMyReviews && (
          <Pill active={view === "my_reviews"} onClick={() => { setView("my_reviews"); setPage(1); }}>
            My Reviews
          </Pill>
        )}
        {showReadyPublish && (
          <Pill active={view === "ready_publish"} onClick={() => { setView("ready_publish"); setPage(1); }}>
            Ready to Publish
          </Pill>
        )}
      </div>

      {/* Search + filter + actions */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            placeholder="Search title…"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
          />
        </div>

        <select
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 lg:w-[200px]"
          value={productId === "" ? "" : String(productId)}
          onChange={(e) => {
            setProductId(e.target.value ? Number(e.target.value) : "");
            setPage(1);
          }}
        >
          <option value="">All Products</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => loadList()}
          disabled={loading}
          className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-60"
        >
          <RotateCcw className={cn("size-4", loading && "animate-spin")} />
          Refresh
        </button>

        {perms.canCreate && (
          <button
            type="button"
            onClick={() => router.push("/portal/manage/tutorial/new")}
            className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700"
          >
            <Plus className="size-4" />
            Create Article
          </button>
        )}
      </div>

      {/* Status tabs */}
      {(view === "mine" || view === "org_all") && (
        <div className="flex flex-wrap gap-2">
          {(["all", "draft", "review", "published", "rejected"] as const).map((t) => (
            <Pill key={t} active={tab === t} onClick={() => { setTab(t); setPage(1); }}>
              {t === "all" ? "All" : t[0].toUpperCase() + t.slice(1)}
            </Pill>
          ))}
        </div>
      )}

      {view === "org_drafts" && (
        <div className="flex flex-wrap gap-2">
          {(["all", "draft", "rejected"] as const).map((t) => (
            <Pill key={t} active={tab === t} onClick={() => { setTab(t as any); setPage(1); }}>
              {t === "all" ? "All" : t[0].toUpperCase() + t.slice(1)}
            </Pill>
          ))}
        </div>
      )}

      {/* Articles card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-sm font-bold text-slate-900">Articles ({totalRows})</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Show</span>
            <select
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-400">
            <Loader2 className="size-4 animate-spin" /> Loading…
          </div>
        ) : filteredClient.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="mb-3 size-8 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">Belum ada artikel.</p>
          </div>
        ) : (
          <div className="w-full overflow-auto">
            <table className="min-w-full w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-3">Title</th>
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">{dateColLabel}</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClient.map((a) => {
                  const label = workflowLabel(a);

                  const date =
                    view === "review_queue"
                      ? fmt(a.submitted_at)
                      : view === "ready_publish"
                      ? fmt(a.reviewed_at)
                      : view === "my_reviews"
                      ? fmt(a.reviewed_at ?? a.rejected_at ?? a.updated_at)
                      : label === "published"
                      ? fmt(a.published_at ?? a.updated_at)
                      : fmt(a.updated_at);

                  return (
                    <tr key={a.id} className="transition-colors hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                            <FileText className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900">{a.title}</div>
                            <div className="text-xs text-slate-400">#{a.id}</div>

                            {(view === "org_all" || view === "org_drafts") && a.created_by_email && (
                              <div className="mt-1 text-xs text-slate-500">By: {a.created_by_email}</div>
                            )}

                            {view === "org_all" &&
                              String(a.status).toLowerCase() === "published" &&
                              a.published_by_email && (
                                <div className="mt-1 text-xs text-slate-500">
                                  Published by: {a.published_by_email}
                                </div>
                              )}

                            {(view === "review_queue" ||
                              view === "my_reviews" ||
                              view === "ready_publish") &&
                              a.organization_name && (
                                <div className="mt-1 text-xs text-slate-500">
                                  Org: {a.organization_name}
                                </div>
                              )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3 text-slate-700">{a.product_name ?? "-"}</td>

                      <td className="px-5 py-3">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
                            badgeClass(label)
                          )}
                        >
                          {label}
                        </span>
                      </td>

                      <td className="px-5 py-3 text-xs text-slate-500">{date}</td>

                      <td className="px-5 py-3 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/portal/manage/tutorial/${a.id}?return=${encodeURIComponent(openReturn)}`
                            )
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                        >
                          Open
                          <ChevronRight className="size-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-center gap-1.5 border-t border-slate-100 px-5 py-4">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className={cn(
                  "min-w-9 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  page === p
                    ? "bg-teal-600 text-white"
                    : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {perms.canReview && (
        <p className="text-xs text-slate-400">
          Tips: Setelah Approve/Reject, artikel akan hilang dari <b>Review Queue</b> (karena sudah
          reviewed). Cek hasilnya di <b>My Reviews</b> atau untuk publisher cek{" "}
          <b>Ready to Publish</b>.
        </p>
      )}
    </div>
  );
}
