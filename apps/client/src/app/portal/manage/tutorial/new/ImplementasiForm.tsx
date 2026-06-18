"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Send, UploadCloud, Loader2, Ban, Package, Type, FileText } from "lucide-react";
import { apiFetch } from "@/lib/api";
import RichTextEditorClient from "@/components/portal/RichTextEditorClient";
import { useClientSession } from "@/hooks/useClientSession";
import { cn } from "@/lib/utils";

type Product = { id: number; name: string };
type MasterProductsResp = { data: Product[] };

type BusyAction = null | "draft" | "submit" | "publish";

function SubmittingOverlay({ action }: { action: BusyAction }) {
  const text =
    action === "draft"
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
 * Mode "Implementasi": form tunggal (cara langsung).
 * Header & navigasi mode diatur oleh container (page.tsx).
 */
export default function ImplementasiForm() {
  const router = useRouter();
  const { perms } = useClientSession();

  const [loadingMeta, setLoadingMeta] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyAction, setBusyAction] = useState<BusyAction>(null);
  const [error, setError] = useState("");

  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState<number | "">("");

  const [title, setTitle] = useState("");
  const [bodyHtml, setBodyHtml] = useState<string>("<p></p>");

  const [createdId, setCreatedId] = useState<number | null>(null);

  const isFullAccess = useMemo(() => {
    return perms.canCreate && perms.canReview && perms.canPublish;
  }, [perms.canCreate, perms.canReview, perms.canPublish]);

  const canSubmitReview = useMemo(() => {
    return perms.canCreate && !isFullAccess;
  }, [perms.canCreate, isFullAccess]);

  const canPublishNow = useMemo(() => {
    return isFullAccess;
  }, [isFullAccess]);

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

  const validate = () => {
    if (productId === "") return "Product wajib dipilih.";
    if (!title.trim()) return "Title wajib diisi.";
    if (!bodyHtml || bodyHtml.trim() === "<p></p>") return "Content masih kosong.";
    return "";
  };

  async function createArticle(): Promise<number> {
    const payload = {
      product_id: productId === "" ? null : productId,
      title: title.trim(),
      body_html: bodyHtml,
    };

    const json: any = await apiFetch("/portal/user-articles", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const id = json?.id ?? json?.data?.id;
    if (!id) throw new Error("Create berhasil tapi id tidak ada di response.");
    return Number(id);
  }

  const onSaveDraft = async () => {
    if (saving) return; // anti double click
    const v = validate();
    if (v) return setError(v);

    setSaving(true);
    setBusyAction("draft");
    setError("");
    setCreatedId(null);

    try {
      const id = await createArticle();
      setCreatedId(id);

      router.push(`/portal/manage/tutorial/${id}?return=${encodeURIComponent("/portal/manage/tutorial")}`);
      router.refresh();
      return;
    } catch (e: any) {
      setError(e?.message ?? "Gagal create draft");
      setSaving(false);
      setBusyAction(null);
    }
  };

  const onSubmitReview = async () => {
    if (saving) return;
    const v = validate();
    if (v) return setError(v);

    setSaving(true);
    setBusyAction("submit");
    setError("");
    setCreatedId(null);

    try {
      const id = await createArticle();
      setCreatedId(id);

      await apiFetch(`/portal/user-articles/${id}/submit-review`, { method: "POST" });

      router.push("/portal/manage/tutorial");
      router.refresh();
      return;
    } catch (e: any) {
      setError(e?.message ?? "Gagal submit review");
      setSaving(false);
      setBusyAction(null);
    }
  };

  const onPublishNow = async () => {
    if (saving) return;
    const v = validate();
    if (v) return setError(v);

    setSaving(true);
    setBusyAction("publish");
    setError("");
    setCreatedId(null);

    try {
      const id = await createArticle();
      setCreatedId(id);

      await apiFetch(`/portal/user-articles/${id}/publish`, { method: "POST" });

      router.push("/portal/manage/tutorial");
      router.refresh();
      return;
    } catch (e: any) {
      setError(e?.message ?? "Gagal publish");
      setSaving(false);
      setBusyAction(null);
    }
  };

  return (
    <>
      {saving && <SubmittingOverlay action={busyAction} />}

      <div className={cn("space-y-5", saving && "pointer-events-none select-none")}>
        {error && (
          <div className="space-y-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <div className="flex items-start gap-2">
              <Ban className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </div>
            {createdId ? (
              <div className="flex flex-wrap gap-2">
                <button
                  className="rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                  onClick={() =>
                    router.push(`/portal/manage/tutorial/${createdId}?return=${encodeURIComponent("/portal/manage/tutorial")}`)
                  }
                >
                  Open Draft (#{createdId})
                </button>
                <button
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  onClick={() => router.push("/portal/manage/tutorial")}
                >
                  Back to List
                </button>
              </div>
            ) : null}
          </div>
        )}

        {/* Product */}
        <SectionCard icon={<Package className="size-4" />} title="Product">
          <select
            className={inputCls}
            value={productId === "" ? "" : String(productId)}
            onChange={(e) => setProductId(e.target.value ? Number(e.target.value) : "")}
            disabled={loadingMeta || saving}
          >
            <option value="">— Select Product —</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {products.length === 0 && !loadingMeta && (
            <p className="mt-2 text-xs text-red-600">
              Product list kosong. Pastikan endpoint <b>/api/portal/master-products</b> bisa diakses.
            </p>
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
              onClick={onSaveDraft}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-60"
            >
              <Save className="size-4" />
              {saving && busyAction === "draft" ? "Saving…" : "Save Draft"}
            </button>

            {canSubmitReview && (
              <button
                type="button"
                onClick={onSubmitReview}
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
                onClick={onPublishNow}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700 disabled:opacity-60"
              >
                <UploadCloud className="size-4" />
                {saving && busyAction === "publish" ? "Publishing…" : "Publish"}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
