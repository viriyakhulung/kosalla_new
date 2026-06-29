"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Send,
  UploadCloud,
  Check,
  X,
  Save,
  Loader2,
  Ban,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import RichTextEditor from "@/components/portal/RichTextEditor";
import { useClientSession } from "@/hooks/useClientSession";
import { cn } from "@/lib/utils";

type Article = {
  id: number;
  organization_id: number;
  organization_name?: string | null;

  product_id: number;
  product_name?: string | null;

  title: string;
  body_html: string;

  status: "draft" | "review" | "published" | "rejected" | string;

  reviewer_id?: number | null;

  submitted_at?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: number | null;

  rejected_at?: string | null;
  rejected_by?: number | null;
  rejected_reason?: string | null;

  published_at?: string | null;
  published_by?: number | null;

  created_by?: number | null;
  created_by_email?: string | null;

  updated_at?: string | null;
};

type BusyAction =
  | null
  | "save"
  | "save_published"
  | "submit"
  | "publish"
  | "delete_draft"
  | "delete_published"
  | "approve"
  | "reject";

function fmt(dt?: string | null) {
  if (!dt) return "-";
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return dt;
  }
}

function workflowLabel(a: Article) {
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

function badge(label: string) {
  const s = label.toLowerCase();
  if (s === "draft") return "bg-slate-100 text-slate-700";
  if (s === "review") return "bg-amber-100 text-amber-800";
  if (s === "approved") return "bg-blue-100 text-blue-700";
  if (s === "published") return "bg-green-100 text-green-700";
  if (s === "rejected") return "bg-red-100 text-red-700";
  return "bg-slate-100 text-slate-700";
}

const PROSE =
  "text-sm leading-relaxed text-slate-800 " +
  "[&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:text-xl [&_h1]:font-bold [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-bold " +
  "[&_h3]:mt-3 [&_h3]:mb-1.5 [&_h3]:text-base [&_h3]:font-semibold " +
  "[&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2 [&_li]:my-1 " +
  "[&_blockquote]:border-l-4 [&_blockquote]:border-slate-200 [&_blockquote]:pl-3 [&_blockquote]:text-slate-600 " +
  "[&_pre]:bg-slate-50 [&_pre]:border [&_pre]:border-slate-200 [&_pre]:rounded [&_pre]:p-3 [&_pre]:overflow-auto " +
  "[&_code]:bg-slate-50 [&_code]:px-1 [&_code]:rounded [&_a]:text-teal-600 [&_a]:underline " +
  "[&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-slate-200 [&_th]:p-2 [&_td]:border [&_td]:border-slate-200 [&_td]:p-2 " +
  "[&_img]:max-w-full [&_img]:h-auto [&_img]:rounded [&_img]:my-2";

const inputCls =
  "h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 " +
  "transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 disabled:bg-slate-50 disabled:text-slate-500";

function SubmittingOverlay({ action }: { action: BusyAction }) {
  const text =
    action === "save"
      ? "Saving…"
      : action === "save_published"
      ? "Saving published…"
      : action === "submit"
      ? "Submitting review…"
      : action === "publish"
      ? "Publishing…"
      : action === "delete_draft"
      ? "Deleting draft…"
      : action === "delete_published"
      ? "Deleting article…"
      : action === "approve"
      ? "Approving…"
      : action === "reject"
      ? "Rejecting…"
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

export default function UserArticleDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { user, perms } = useClientSession();

  const id = Number(params.id);
  const returnTo = searchParams.get("return") || "/portal/manage/tutorial";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyAction, setBusyAction] = useState<BusyAction>(null);
  const [error, setError] = useState("");

  const [article, setArticle] = useState<Article | null>(null);

  const [editMode, setEditMode] = useState(false);
  const [title, setTitle] = useState("");
  const [bodyHtml, setBodyHtml] = useState<string>("<p></p>");

  // reject UI
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const a = await apiFetch<Article>(`/portal/user-articles/${id}`);
      setArticle(a);
      setTitle(a.title || "");
      setBodyHtml(a.body_html || "<p></p>");
    } catch (e: any) {
      setError(e?.message ?? "Gagal load artikel");
      setArticle(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!Number.isFinite(id) || id <= 0) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ✅ Lock scroll saat saving
  useEffect(() => {
    if (!saving) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [saving]);

  const isOwner = useMemo(() => {
    if (!article) return false;
    if (!article.created_by || !user?.id) return false;
    return Number(article.created_by) === Number(user.id);
  }, [article, user?.id]);

  // internal role check (superadmin/viriyastaff)
  const isInternalRole = useMemo(() => {
    const rid = Number((user as any)?.master_role_id ?? 0);
    return rid === 1 || rid === 2;
  }, [user]);

  // internal publisher boleh manage draft user lain
  const canManageOthersDraft = useMemo(() => {
    return isInternalRole && perms.canPublish;
  }, [isInternalRole, perms.canPublish]);

  const label = article ? workflowLabel(article) : "unknown";

  const isPublished = useMemo(() => {
    if (!article) return false;
    return String(article.status).toLowerCase() === "published" && !!article.published_at;
  }, [article]);

  // Draft/rejected/review(not approved) editable by author OR internal publisher
  const canEdit =
    !!article &&
    (((perms.canCreate && isOwner) || canManageOthersDraft) &&
      (String(article.status).toLowerCase() === "draft" ||
        String(article.status).toLowerCase() === "rejected" ||
        (String(article.status).toLowerCase() === "review" && !article.reviewed_at && !article.published_at)));

  // published editable by publisher
  const canEditPublished = !!article && isPublished && perms.canPublish;

  const canApproveReject = useMemo(() => {
    if (!article) return false;
    if (!perms.canReview) return false;
    if (String(article.status).toLowerCase() !== "review") return false;
    if (article.reviewed_at) return false;
    if (article.created_by && user?.id && Number(article.created_by) === Number(user.id)) return false; // anti self-review
    if (article.reviewer_id && user?.id && Number(article.reviewer_id) !== Number(user.id)) return false; // claimed by other
    return true;
  }, [article, perms.canReview, user?.id]);

  // publish hanya boleh kalau approved
  const canPublish = useMemo(() => {
    if (!article) return false;
    if (!perms.canPublish) return false;

    const s = String(article.status).toLowerCase();
    if (s === "review" && article.reviewed_at && !article.published_at) return true;

    return false;
  }, [article, perms.canPublish]);

  // submit review (draft/rejected): author OR internal publisher
  const canSubmitReview = useMemo(() => {
    if (!article) return false;
    const s = String(article.status).toLowerCase();
    if (s !== "draft" && s !== "rejected") return false;
    if (article.published_at) return false;

    if (perms.canCreate && isOwner) return true;
    if (canManageOthersDraft) return true;

    return false;
  }, [article, perms.canCreate, isOwner, canManageOthersDraft]);

  // delete draft/rejected: author OR internal publisher
  const canDeleteDraft = useMemo(() => {
    if (!article) return false;
    const s = String(article.status).toLowerCase();
    if (s !== "draft" && s !== "rejected") return false;
    if (article.published_at) return false;

    if (perms.canCreate && isOwner) return true;
    if (canManageOthersDraft) return true;

    return false;
  }, [article, perms.canCreate, isOwner, canManageOthersDraft]);

  const canDeletePublished = !!article && isPublished && perms.canPublish;

  const validateContent = () => {
    if (!title.trim()) return "Title wajib diisi.";
    if (!bodyHtml || bodyHtml.trim() === "<p></p>") return "Content masih kosong.";
    return "";
  };

  const onSave = async () => {
    if (!article) return;
    if (saving) return;

    setError("");

    const v = validateContent();
    if (v) return setError(v);

    if (String(article.status).toLowerCase() === "review" && !article.reviewed_at) {
      const ok = confirm(
        "Artikel sedang status REVIEW. Setelah disimpan, artikel akan dianggap update terbaru untuk reviewer. Lanjut?"
      );
      if (!ok) return;
    }

    setSaving(true);
    setBusyAction("save");

    try {
      await apiFetch(`/portal/user-articles/${article.id}`, {
        method: "PUT",
        body: JSON.stringify({
          title: title.trim(),
          body_html: bodyHtml,
        }),
      });
      setEditMode(false);
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Gagal save");
    } finally {
      setSaving(false);
      setBusyAction(null);
    }
  };

  // ✅ IMPORTANT: use POST for /published to survive hosting/proxy issues
  const onSavePublished = async () => {
    if (!article) return;
    if (saving) return;

    setError("");

    const v = validateContent();
    if (v) return setError(v);

    setSaving(true);
    setBusyAction("save_published");

    try {
      await apiFetch(`/portal/user-articles/${article.id}/published`, {
        method: "POST", // ✅ ganti ke POST
        body: JSON.stringify({
          title: title.trim(),
          body_html: bodyHtml,
        }),
      });
      setEditMode(false);
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Gagal update published");
    } finally {
      setSaving(false);
      setBusyAction(null);
    }
  };

  const onSubmitReview = async () => {
    if (!article) return;
    if (saving) return;

    setError("");
    setSaving(true);
    setBusyAction("submit");

    try {
      const statusBefore = String(article.status).toLowerCase();

      if (editMode) {
        const v = validateContent();
        if (v) {
          setSaving(false);
          setBusyAction(null);
          return setError(v);
        }

        await apiFetch(`/portal/user-articles/${article.id}`, {
          method: "PUT",
          body: JSON.stringify({
            title: title.trim(),
            body_html: bodyHtml,
          }),
        });

        setEditMode(false);
        await load();

        if (statusBefore === "rejected") {
          setSaving(false);
          setBusyAction(null);
          return;
        }
      }

      await apiFetch(`/portal/user-articles/${article.id}/submit-review`, { method: "POST" });
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Gagal submit review");
    } finally {
      setSaving(false);
      setBusyAction(null);
    }
  };

  const onApprove = async () => {
    if (!article) return;
    if (saving) return;

    setError("");
    setSaving(true);
    setBusyAction("approve");

    try {
      await apiFetch(`/portal/user-articles/review/${article.id}/approve`, { method: "POST" });
      setShowRejectBox(false);
      setRejectReason("");
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Gagal approve");
    } finally {
      setSaving(false);
      setBusyAction(null);
    }
  };

  const onReject = async () => {
    if (!article) return;
    if (saving) return;

    setError("");
    if (!rejectReason.trim()) return setError("Reject reason wajib diisi.");

    setSaving(true);
    setBusyAction("reject");

    try {
      await apiFetch(`/portal/user-articles/review/${article.id}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });
      setShowRejectBox(false);
      setRejectReason("");
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Gagal reject");
    } finally {
      setSaving(false);
      setBusyAction(null);
    }
  };

  const onPublish = async () => {
    if (!article) return;
    if (saving) return;

    setError("");
    setSaving(true);
    setBusyAction("publish");

    try {
      await apiFetch(`/portal/user-articles/${article.id}/publish`, { method: "POST" });
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Gagal publish");
    } finally {
      setSaving(false);
      setBusyAction(null);
    }
  };

  const onDeletePublished = async () => {
    if (!article) return;
    if (saving) return;

    setError("");

    const ok = confirm("Yakin ingin menghapus artikel published ini? Artikel akan hilang dari Portal user.");
    if (!ok) return;

    setSaving(true);
    setBusyAction("delete_published");

    try {
      await apiFetch(`/portal/user-articles/${article.id}`, { method: "DELETE" });
      router.push(returnTo);
      router.refresh();
      return;
    } catch (e: any) {
      setError(e?.message ?? "Gagal delete");
      setSaving(false);
      setBusyAction(null);
    }
  };

  const onDeleteDraft = async () => {
    if (!article) return;
    if (saving) return;

    setError("");
    const ok = confirm("Yakin ingin menghapus draft ini secara permanen?");
    if (!ok) return;

    setSaving(true);
    setBusyAction("delete_draft");

    try {
      await apiFetch(`/portal/user-articles/${article.id}`, { method: "DELETE" });
      router.push(returnTo);
      router.refresh();
      return;
    } catch (e: any) {
      setError(e?.message ?? "Gagal delete draft");
      setSaving(false);
      setBusyAction(null);
    }
  };

  return (
    <>
      {saving && <SubmittingOverlay action={busyAction} />}

      <div className={cn("mx-auto max-w-4xl space-y-5", saving && "pointer-events-none select-none")}>
        {/* Header row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Article Detail</h2>
            <p className="mt-0.5 text-sm text-slate-500">Draft → Review → Publish</p>
          </div>
          <button
            type="button"
            onClick={() => router.push(returnTo)}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-60"
          >
            <ArrowLeft className="size-4" />
            Back
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <Ban className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-400">
            <Loader2 className="size-4 animate-spin" /> Loading…
          </div>
        ) : !article ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400 shadow-sm">
            Not found
          </div>
        ) : (
          <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            {/* Org / Product / Status */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                    Organization
                  </p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {article.organization_name ?? `#${article.organization_id}`}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                    Product
                  </p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {article.product_name ?? `#${article.product_id}`}
                  </p>
                </div>
              </div>

              <span
                className={cn(
                  "inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize",
                  badge(label)
                )}
              >
                {label}
              </span>
            </div>

            {/* Timeline */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { k: "Submitted", v: fmt(article.submitted_at) },
                { k: "Reviewed", v: fmt(article.reviewed_at) },
                { k: "Published", v: fmt(article.published_at) },
              ].map((x) => (
                <div key={x.k} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{x.k}</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">{x.v}</p>
                </div>
              ))}
            </div>

            {/* Title */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Title</label>
              <input
                className={inputCls}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={!editMode || saving}
              />
            </div>

            {/* Content */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">Content (HTML)</label>
              {editMode ? (
                <div className="rounded-xl border border-slate-200 bg-white p-2">
                  <RichTextEditor value={bodyHtml} onChange={setBodyHtml} />
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className={`kb-content ${PROSE}`} dangerouslySetInnerHTML={{ __html: article.body_html }} />
                </div>
              )}
            </div>

            {String(article.status).toLowerCase() === "rejected" && article.rejected_reason && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <b>Rejected reason:</b> {article.rejected_reason}
              </div>
            )}

            {showRejectBox && (
              <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="text-sm font-semibold text-amber-900">Reject reason</div>
                <textarea
                  className="w-full rounded-lg border border-amber-200 bg-white p-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300/40"
                  rows={4}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Tuliskan alasan reject..."
                  disabled={saving}
                />
                <div className="flex justify-end gap-2">
                  <button
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    onClick={() => {
                      setShowRejectBox(false);
                      setRejectReason("");
                    }}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                    onClick={onReject}
                    disabled={saving}
                  >
                    <X className="size-4" /> Confirm Reject
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
              {canEdit && !editMode && (
                <button
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-60"
                  onClick={() => setEditMode(true)}
                  disabled={saving}
                >
                  <Pencil className="size-4" /> Edit
                </button>
              )}

              {canDeleteDraft && !editMode && (
                <button
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-60"
                  onClick={onDeleteDraft}
                  disabled={saving}
                >
                  <Trash2 className="size-4" /> Delete Draft
                </button>
              )}

              {canEditPublished && !editMode && (
                <button
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-60"
                  onClick={() => setEditMode(true)}
                  disabled={saving}
                >
                  <Pencil className="size-4" /> Edit Published
                </button>
              )}

              {editMode && (
                <>
                  <button
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-60"
                    onClick={() => {
                      if (!article) return;
                      setEditMode(false);
                      setTitle(article.title);
                      setBodyHtml(article.body_html);
                    }}
                    disabled={saving}
                  >
                    Cancel
                  </button>

                  <button
                    className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700 disabled:opacity-60"
                    onClick={isPublished ? onSavePublished : onSave}
                    disabled={saving}
                  >
                    <Save className="size-4" /> Save
                  </button>
                </>
              )}

              {canSubmitReview && (
                <button
                  className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700 disabled:opacity-60"
                  onClick={onSubmitReview}
                  disabled={saving}
                >
                  <Send className="size-4" />
                  {String(article.status).toLowerCase() === "rejected" ? "Resubmit Review" : "Submit Review"}
                </button>
              )}

              {canApproveReject && (
                <>
                  <button
                    className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-green-700 disabled:opacity-60"
                    onClick={onApprove}
                    disabled={saving}
                  >
                    <Check className="size-4" /> Approve
                  </button>
                  <button
                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-60"
                    onClick={() => setShowRejectBox(true)}
                    disabled={saving}
                  >
                    <X className="size-4" /> Reject
                  </button>
                </>
              )}

              {canPublish && (
                <button
                  className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700 disabled:opacity-60"
                  onClick={onPublish}
                  disabled={saving}
                >
                  <UploadCloud className="size-4" /> Publish
                </button>
              )}

              {canDeletePublished && (
                <button
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-60"
                  onClick={onDeletePublished}
                  disabled={saving}
                >
                  <Trash2 className="size-4" /> Delete
                </button>
              )}
            </div>

            <p className="text-xs text-slate-400">
              Publish hanya tersedia jika artikel sudah <b>approved</b> (reviewed_at terisi).
            </p>
          </div>
        )}
      </div>
    </>
  );
}
