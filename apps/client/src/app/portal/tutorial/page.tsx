"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, FileText, ArrowRight, BookOpen, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

type Product = { id: number; name: string };

type KBArticle = {
  id?: number;
  title?: string | null;
  slug: string;
  product_id?: number | null;
  product?: Product | null;
  product_name?: string | null;
  updated_at?: string | null;
};

type KBListResponse = {
  data: KBArticle[];
  products?: Product[];
};

function safeDecode(v: string) {
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

function fmtRelative(iso?: string | null): string {
  if (!iso) return "-";
  try {
    const diffMs = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diffMs / 60_000);
    if (min < 1) return "baru saja";
    if (min < 60) return `${min} menit lalu`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h} jam lalu`;
    const d = Math.floor(h / 24);
    if (d === 1) return "kemarin";
    if (d < 7) return `${d} hari lalu`;
    const w = Math.floor(d / 7);
    if (w < 5) return `${w} minggu lalu`;
    const mo = Math.floor(d / 30);
    if (mo < 12) return `${mo} bulan lalu`;
    return `${Math.floor(d / 365)} tahun lalu`;
  } catch {
    return "-";
  }
}

export default function TutorialListPage() {
  const router = useRouter();
  const sp = useSearchParams();

  // ✅ balik ke mana saat keluar dari modul preview
  const returnTo = useMemo(() => {
    const raw = sp.get("return") || sp.get("back"); // kompatibel link lama
    return raw ? safeDecode(raw) : "";
  }, [sp]);

  // ✅ URL list sekarang (untuk detail balik ke list)
  const listUrl = useMemo(() => {
    const qs = sp.toString();
    return qs ? `/portal/tutorial?${qs}` : "/portal/tutorial";
  }, [sp]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [q, setQ] = useState("");
  const [productId, setProductId] = useState<number | "">("");

  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<KBArticle[]>([]);

  const debounceRef = useRef<any>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams();
      qs.set("per_page", "20");
      if (q.trim()) qs.set("q", q.trim());
      if (productId !== "") qs.set("product_id", String(productId));

      const json = await apiFetch<KBListResponse>(`/portal/kb/articles?${qs.toString()}`);
      setItems(json?.data ?? []);
      setProducts(json?.products ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Gagal load tutorial");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(), 350);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, productId]);

  function openArticle(slug: string) {
    const url =
      `/portal/tutorial/${slug}` +
      `?back=${encodeURIComponent(listUrl)}` +
      (returnTo ? `&return=${encodeURIComponent(returnTo)}` : "");
    router.push(url);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      {/* Search + filter */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
            placeholder="Search tutorial & FAQ…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <select
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 sm:w-[200px]"
          value={productId === "" ? "" : String(productId)}
          onChange={(e) => setProductId(e.target.value ? Number(e.target.value) : "")}
        >
          <option value="">All Products</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-400">
          <Loader2 className="size-4 animate-spin" /> Memuat artikel…
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <BookOpen className="mb-3 size-8 text-slate-300" />
          <p className="text-sm font-medium text-slate-600">Tidak ada artikel.</p>
          <p className="text-xs text-slate-400">Coba ubah kata kunci atau filter produk.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {items.map((a) => {
            const prodName = a.product?.name ?? a.product_name ?? null;
            return (
              <button
                key={a.slug}
                type="button"
                onClick={() => openArticle(a.slug)}
                className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-teal-300 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-bold leading-snug text-slate-900 group-hover:text-teal-700">
                      {a.title ?? a.slug}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {prodName ? `${prodName} · ` : ""}diperbarui {fmtRelative(a.updated_at)}
                    </p>
                  </div>
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                    <FileText className="size-4" />
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-3">
                  {prodName ? (
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                      {prodName}
                    </span>
                  ) : (
                    <span />
                  )}
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-teal-600 transition-all group-hover:gap-2">
                    Baca <ArrowRight className="size-4" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
