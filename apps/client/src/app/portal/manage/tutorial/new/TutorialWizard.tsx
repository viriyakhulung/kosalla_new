"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Send,
  UploadCloud,
  Loader2,
  Ban,
  Package,
  Type,
  FileText,
  Lock,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import RichTextEditorClient from "@/components/portal/RichTextEditorClient";
import { useClientSession } from "@/hooks/useClientSession";
import { cn } from "@/lib/utils";
import { Stepper, type Step } from "@/components/ui/Stepper";

type Product = { id: number; name: string };
type MasterProductsResp = { data: Product[] };

type BusyAction = null | "next" | "draft" | "submit" | "publish";

const STEPS: Step[] = [
  { id: "content", label: "Konten" },
  { id: "review", label: "Review" },
];

// Styling render body_html — disamakan dengan halaman detail tutorial ([slug])
// agar preview di Step Review tampil identik dengan hasil akhir.
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

function SubmittingOverlay({ action }: { action: BusyAction }) {
  const text =
    action === "next"
      ? "Menyimpan draft…"
      : action === "draft"
      ? "Saving draft…"
      : action === "submit"
      ? "Submitting review…"
      : action === "publish"
      ? "Publishing…"
      : "Processing…";

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm"
      aria-busy="true"
      aria-live="polite"
      role="status"
    >
      <div className="w-[360px] rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-2xl">
        <div className="flex items-center gap-3">
          <Loader2 className="size-5 animate-spin text-teal-600" />
          <p className="text-sm font-semibold text-slate-900">{text}</p>
        </div>
        <p className="mt-1 text-xs text-slate-500">Please wait. Do not refresh / click again.</p>
      </div>
    </div>
  );
}

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-600">
          {icon}
        </div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-600">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

const inputCls =
  "h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 " +
  "placeholder-slate-400 transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 disabled:opacity-60";

/**
 * Mode "Tutorial": wizard multi-step (Konten → Review).
 * Header & navigasi mode diatur oleh container (page.tsx).
 */
export default function TutorialWizard() {
  const router = useRouter();
  const { perms } = useClientSession();

  const [stepIndex, setStepIndex] = useState(0);

  const [loadingMeta, setLoadingMeta] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyAction, setBusyAction] = useState<BusyAction>(null);
  const [error, setError] = useState("");

  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState<number | "">("");

  const [title, setTitle] = useState("");
  const [bodyHtml, setBodyHtml] = useState<string>("<p></p>");

  // id draft setelah tercipta (null = belum disimpan ke DB)
  const [articleId, setArticleId] = useState<number | null>(null);

  const isFullAccess = useMemo(() => {
    return perms.canCreate && perms.canReview && perms.canPublish;
  }, [perms.canCreate, perms.canReview, perms.canPublish]);

  const canSubmitReview = useMemo(() => {
    return perms.canCreate && !isFullAccess;
  }, [perms.canCreate, isFullAccess]);

  const canPublishNow = useMemo(() => {
    return isFullAccess;
  }, [isFullAccess]);

  const productName = useMemo(() => {
    if (productId === "") return null;
    return products.find((p) => p.id === productId)?.name ?? null;
  }, [productId, products]);

  async function loadMeta() {
    setLoadingMeta(true);
    setError("");
    try {
      const json = await apiFetch<MasterProductsResp>("/portal/master-products");
      setProducts(json?.data ?? []);
    } catch (e: any) {
      setProducts([]);
      setError(e?.message ?? "Gagal load master products");
    } finally {
      setLoadingMeta(false);
    }
  }

  useEffect(() => {
    loadMeta();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lock scroll saat saving (mirip ticket)
  useEffect(() => {
    if (!saving) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [saving]);

  if (!perms.canCreate) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">Unauthorized</h1>
        <p className="mt-2 text-sm text-slate-600">Kamu tidak punya akses create.</p>
      </div>
    );
  }

  const validateContent = () => {
    if (productId === "") return "Product wajib dipilih.";
    if (!title.trim()) return "Title wajib diisi.";
    if (!bodyHtml || bodyHtml.trim() === "<p></p>") return "Content masih kosong.";
    return "";
  };

  // Step 1 → Review: draft lahir di sini (store butuh product+title+body — sudah lengkap),
  // atau di-update via PUT bila draft sudah pernah tercipta (kembali-maju antar step).
  const handleNextFromContent = async () => {
    if (saving) return;
    const v = validateContent();
    if (v) return setError(v);

    setSaving(true);
    setBusyAction("next");
    setError("");
    try {
      if (articleId === null) {
        const created: any = await apiFetch("/portal/user-articles", {
          method: "POST",
          body: JSON.stringify({
            product_id: productId,
            title: title.trim(),
            body_html: bodyHtml,
          }),
        });
        const id = created?.id ?? created?.data?.id;
        if (!id) throw new Error("Create berhasil tapi id tidak ada di response.");
        setArticleId(Number(id));
      } else {
        // product_id tidak dikirim — tidak bisa diubah via PUT (terkunci, lihat UI).
        await apiFetch(`/portal/user-articles/${articleId}`, {
          method: "PUT",
          body: JSON.stringify({ title: title.trim(), body_html: bodyHtml }),
        });
      }
      setStepIndex(1);
    } catch (e: any) {
      setError(e?.message ?? "Gagal menyimpan draft.");
    } finally {
      setSaving(false);
      setBusyAction(null);
    }
  };

  // Step Review: simpan sebagai draft & keluar. Artikel sudah ter-store di Step 1,
  // jadi cukup navigasi kembali ke daftar.
  const handleSaveDraftAndExit = () => {
    if (saving) return;
    router.push("/portal/manage/tutorial");
    router.refresh();
  };

  const handleSubmitReview = async () => {
    if (saving || !articleId) return;
    setSaving(true);
    setBusyAction("submit");
    setError("");
    try {
      await apiFetch(`/portal/user-articles/${articleId}/submit-review`, { method: "POST" });
      router.push("/portal/manage/tutorial");
      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? "Gagal submit review.");
      setSaving(false);
      setBusyAction(null);
    }
  };

  const handlePublish = async () => {
    if (saving || !articleId) return;
    setSaving(true);
    setBusyAction("publish");
    setError("");
    try {
      await apiFetch(`/portal/user-articles/${articleId}/publish`, { method: "POST" });
      router.push("/portal/manage/tutorial");
      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? "Gagal publish.");
      setSaving(false);
      setBusyAction(null);
    }
  };

  const productLocked = articleId !== null;

  return (
    <>
      {saving && <SubmittingOverlay action={busyAction} />}

      <div className={cn("space-y-5", saving && "pointer-events-none select-none")}>
        {/* Stepper */}
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <Stepper steps={STEPS} currentIndex={stepIndex} />
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <Ban className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ================= STEP 1: KONTEN ================= */}
        {stepIndex === 0 && (
          <>
            {/* Product */}
            <SectionCard icon={<Package className="size-4" />} title="Product">
              <select
                className={inputCls}
                value={productId === "" ? "" : String(productId)}
                onChange={(e) => setProductId(e.target.value ? Number(e.target.value) : "")}
                disabled={loadingMeta || saving || productLocked}
              >
                <option value="">— Select Product —</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              {productLocked ? (
                <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-500">
                  <Lock className="size-3.5" />
                  Produk tidak dapat diubah setelah draft dibuat. Untuk produk lain, buat artikel baru.
                </p>
              ) : (
                products.length === 0 &&
                !loadingMeta && (
                  <p className="mt-2 text-xs text-red-600">
                    Product list kosong. Pastikan endpoint <b>/api/portal/master-products</b> bisa diakses.
                  </p>
                )
              )}
            </SectionCard>

            {/* Title */}
            <SectionCard icon={<Type className="size-4" />} title="Title">
              <input
                className={inputCls}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Cara cek versi Tibero"
                disabled={saving}
              />
            </SectionCard>

            {/* Content */}
            <SectionCard icon={<FileText className="size-4" />} title="Content (HTML)">
              <div className="rounded-xl border border-slate-200 bg-white p-2">
                <RichTextEditorClient value={bodyHtml} onChange={setBodyHtml} />
              </div>
            </SectionCard>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <p className="text-xs text-slate-500">
                Jangan tutup halaman sebelum lanjut ke Review — draft baru tersimpan setelah langkah ini.
              </p>
              <button
                type="button"
                onClick={handleNextFromContent}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700 disabled:opacity-60"
              >
                {saving && busyAction === "next" ? "Menyimpan…" : "Lanjut ke Review"}
                <ArrowRight className="size-4" />
              </button>
            </div>
          </>
        )}

        {/* ================= STEP 2: REVIEW ================= */}
        {stepIndex === 1 && (
          <>
            <SectionCard icon={<FileText className="size-4" />} title="Preview Artikel">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  {productName && (
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                      {productName}
                    </span>
                  )}
                  {articleId && (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                      Draft #{articleId}
                    </span>
                  )}
                </div>
                <h1 className="text-xl font-bold leading-snug text-slate-900">{title}</h1>
                <hr className="border-slate-100" />
                <div className={`kb-content ${PROSE}`} dangerouslySetInnerHTML={{ __html: bodyHtml }} />
              </div>
            </SectionCard>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <p className="text-xs text-slate-500">
                {isFullAccess ? (
                  <>
                    Mode <b>Full Access</b>: kamu bisa <b>Publish langsung</b> (auto approve + publish).
                  </>
                ) : (
                  <>Catatan: Publish hanya bisa dilakukan setelah artikel di-approve reviewer.</>
                )}
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStepIndex(0)}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-60"
                >
                  <ArrowLeft className="size-4" />
                  Kembali
                </button>

                <button
                  type="button"
                  onClick={handleSaveDraftAndExit}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-60"
                >
                  <Save className="size-4" />
                  Simpan sebagai Draft
                </button>

                {canSubmitReview && (
                  <button
                    type="button"
                    onClick={handleSubmitReview}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700 disabled:opacity-60"
                  >
                    <Send className="size-4" />
                    {saving && busyAction === "submit" ? "Submitting…" : "Submit Review"}
                  </button>
                )}

                {canPublishNow && (
                  <button
                    type="button"
                    onClick={handlePublish}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700 disabled:opacity-60"
                  >
                    <UploadCloud className="size-4" />
                    {saving && busyAction === "publish" ? "Publishing…" : "Publish"}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
