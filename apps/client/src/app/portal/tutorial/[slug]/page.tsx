"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, FileText, CalendarDays, Loader2, BookOpen } from "lucide-react";
import { apiFetch } from "@/lib/api";

type Product = { id: number; name: string };

type KBDetail = {
  id?: number;
  title?: string | null;
  slug?: string | null;
  product?: Product | null;
  product_name?: string | null;
  updated_at?: string | null;

  content_html?: string | null;
  body_html?: string | null;
  html?: string | null;
  content?: string | null;
};

function safeDecode(v: string) {
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
}

const PROSE =
  "text-sm leading-relaxed text-slate-800 " +
  "[&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-slate-900 " +
  "[&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-slate-900 " +
  "[&_h3]:mt-3 [&_h3]:mb-1.5 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-slate-900 " +
  "[&_p]:my-2 " +
  "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2 " +
  "[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2 " +
  "[&_li]:my-1 " +
  "[&_blockquote]:border-l-4 [&_blockquote]:border-slate-200 [&_blockquote]:pl-3 [&_blockquote]:text-slate-600 " +
  "[&_pre]:bg-slate-50 [&_pre]:border [&_pre]:border-slate-200 [&_pre]:rounded [&_pre]:p-3 [&_pre]:overflow-auto " +
  "[&_code]:bg-slate-50 [&_code]:px-1 [&_code]:rounded " +
  "[&_a]:text-teal-600 [&_a]:underline " +
  "[&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-slate-200 [&_th]:p-2 [&_td]:border [&_td]:border-slate-200 [&_td]:p-2 " +
  "[&_img]:max-w-full [&_img]:h-auto [&_img]:rounded [&_img]:my-2";

export default function TutorialDetailPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const sp = useSearchParams();

  const slug = params?.slug;

  const backTarget = useMemo(() => {
    const back = sp.get("back");
    if (back) return safeDecode(back);

    const ret = sp.get("return") || sp.get("back"); // kompatibel
    if (ret) return safeDecode(ret);

    return "/portal/tutorial";
  }, [sp]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<KBDetail | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const json = await apiFetch<any>(`/portal/kb/articles/${slug}`);
      const obj = (json?.data ?? json?.article ?? json) as KBDetail;
      setData(obj ?? null);
    } catch (e: any) {
      setError(e?.message ?? "Gagal load artikel");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const title = data?.title ?? slug;
  const productName = data?.product?.name ?? data?.product_name ?? null;
  const html =
    data?.content_html ??
    data?.body_html ??
    data?.html ??
    data?.content ??
    "<p>(empty)</p>";

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {/* Back */}
      <button
        type="button"
        onClick={() => router.push(backTarget)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-teal-600"
      >
        <ArrowLeft className="size-4" />
        Kembali ke Knowledge Base
      </button>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-400">
          <Loader2 className="size-4 animate-spin" /> Memuat artikel…
        </div>
      ) : !data ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <BookOpen className="mb-3 size-8 text-slate-300" />
          <p className="text-sm font-medium text-slate-600">Artikel tidak ditemukan.</p>
        </div>
      ) : (
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Header */}
          <header className="border-b border-slate-100 px-6 py-5">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                <FileText className="size-4" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold leading-snug text-slate-900">{title}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  {productName && (
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                      {productName}
                    </span>
                  )}
                  {data?.updated_at && (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                      <CalendarDays className="size-3.5" />
                      Diperbarui {new Date(data.updated_at).toLocaleString("id-ID")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="px-6 py-6">
            <div className={`kb-content ${PROSE}`} dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        </article>
      )}
    </div>
  );
}
