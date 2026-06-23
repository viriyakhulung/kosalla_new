"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  RotateCcw,
  Layers2,
  ClipboardList,
  Layers,
  FileText,
  Paperclip,
  MessageSquare,
  Send,
  Download,
  XCircle,
  Share2,
  Loader2,
} from "lucide-react";
import { apiFetch, apiUpload, downloadWithAuth } from "@/lib/api";
import AttachmentPicker from "@/components/portal/AttachmentPicker";
import RichTextEditorClient from "@/components/portal/RichTextEditorClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/* ─── Types ─────────────────────────────────────────────────────────────── */

type Attachment = {
  id: number;
  original_name: string;
  size: number;
  download_url: string;
  mime_type?: string;
};

type Ticket = {
  id: number;
  ticket_number: string;
  subject: string;
  status: string;
  created_at: string;
  description_html: string;
  category?: string | null;
  priority?: string | null;
  tagging_word?: string | null;
  requested_resolution_date?: string | null;
  expected_date?: string | null;
  version?: string | null;
  build_no?: string | null;
  patch_no?: string | null;
  module?: string | null;
  error_code?: string | null;
  severity?: string | null;
  project?: string | null;
  customer?: string | null;
  complete_ps?: boolean | null;
  schedule_comment?: string | null;
  organization?: { id: number; name: string } | null;
  inventory_item?: { id: number; name: string } | null;
  inventory_item_name?: string | null;
  reporter_name?: string | null;
  user?: { id: number; name?: string | null } | null;
  creator?: { id: number; name?: string | null } | null;
  assignee?: { id: number; name?: string | null; email?: string | null } | null;
  attachments?: Attachment[];
  attachments_count?: number;
  team_group_id?: number | null;
  can_transfer?: boolean;
};

type TransferTarget = {
  id: number;
  name: string;
  has_lead: boolean;
};

type MeUser = {
  id: number;
  master_role_id?: number | null;
  master_role?: string | null;
  name?: string | null;
  email?: string | null;
};

type UserLite = {
  id: number;
  name: string;
  email: string;
  master_role?: string | null;
  master_role_id?: number | null;
  organization_id?: number | null;
  organization?: string | null;
};

type CommentAttachment = {
  id: number;
  original_name: string;
  size: number;
  mime_type: string;
  created_at: string;
  download_url: string;
  uploader?: UserLite | null;
};

type Comment = {
  id: number;
  ticket_id: number;
  user_id: number;
  is_internal: boolean;
  body: string;
  created_at: string;
  user: UserLite;
  attachments: CommentAttachment[];
};

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function fmtDate(iso?: string) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function fmtDateShort(iso?: string) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function fmtBytes(n?: number) {
  if (!n && n !== 0) return "-";
  const kb = 1024;
  const mb = kb * 1024;
  if (n >= mb) return `${(n / mb).toFixed(2)} MB`;
  if (n >= kb) return `${(n / kb).toFixed(2)} KB`;
  return `${n} B`;
}

function stripHtmlToText(html: string) {
  return String(html || "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasImageTag(html: string) {
  return /<img\b/i.test(String(html || ""));
}

function isInternal(me: MeUser | null) {
  const id = Number(me?.master_role_id ?? 0);
  const name = String(me?.master_role ?? "").toLowerCase();
  return id === 1 || id === 2 || name === "superadmin" || name === "viriyastaff";
}

function isViriyaUser(user: UserLite): boolean {
  const id = Number(user?.master_role_id ?? 0);
  const name = String(user?.master_role ?? "").toLowerCase();
  return id === 1 || id === 2 || name === "superadmin" || name === "viriyastaff";
}

function nameInitials(name?: string | null): string {
  return (
    String(name ?? "")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

const PROSE =
  "text-sm text-slate-800 " +
  "[&_p]:my-2 [&_br]:my-2 " +
  "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2 " +
  "[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2 " +
  "[&_li]:my-1 " +
  "[&_blockquote]:border-l-4 [&_blockquote]:border-slate-200 [&_blockquote]:pl-3 [&_blockquote]:text-slate-600 " +
  "[&_pre]:bg-slate-50 [&_pre]:border [&_pre]:border-slate-200 [&_pre]:rounded [&_pre]:p-3 [&_pre]:overflow-auto " +
  "[&_code]:bg-slate-50 [&_code]:px-1 [&_code]:rounded " +
  "[&_a]:text-teal-600 [&_a]:underline " +
  "[&_img]:max-w-full [&_img]:h-auto [&_img]:rounded [&_img]:my-2";

/* ─── Sub-components ─────────────────────────────────────────────────────── */

function BusyOverlay({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm"
      aria-busy="true"
      role="status"
    >
      <div className="w-[360px] rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="size-5 animate-spin rounded-full border-2 border-slate-200 border-t-teal-600" />
          <p className="text-sm font-semibold text-slate-900">{title}</p>
        </div>
        {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );
}

function SectionCard({
  icon,
  iconBg,
  iconColor,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <div
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg",
            iconBg,
            iconColor
          )}
        >
          {icon}
        </div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-600">
          {title}
        </h3>
        {subtitle && (
          <span className="text-xs text-slate-400">{subtitle}</span>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function FieldCard({ label, value }: { label: string; value: string }) {
  const empty = !value || value === "-";
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
        {label}
      </p>
      <p
        className={cn(
          "mt-1.5 text-sm font-semibold",
          empty ? "italic text-slate-300" : "text-slate-900"
        )}
      >
        {empty ? "Not specified" : value}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase();
  const cls =
    s === "closed"
      ? "bg-red-100 text-red-600"
      : s === "open"
      ? "bg-green-100 text-green-700"
      : "bg-blue-100 text-blue-600";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        cls
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */

export default function TicketDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const ticketId = params?.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ticket, setTicket] = useState<Ticket | null>(null);

  const [meUser, setMeUser] = useState<MeUser | null>(null);
  const [meLoading, setMeLoading] = useState(true);

  const [commentsLoading, setCommentsLoading] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [chatBody, setChatBody] = useState<string>("<p></p>");
  const [chatFiles, setChatFiles] = useState<File[]>([]);
  const [chatError, setChatError] = useState("");
  const [chatFileError, setChatFileError] = useState("");
  const [sending, setSending] = useState(false);

  const [closing, setClosing] = useState(false);
  const [closeError, setCloseError] = useState("");

  // Transfer / lempar tiket ke team lain
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferTargets, setTransferTargets] = useState<TransferTarget[]>([]);
  const [loadingTargets, setLoadingTargets] = useState(false);
  const [transferTeamId, setTransferTeamId] = useState<number | "">("");
  const [transferNote, setTransferNote] = useState("");
  const [transferring, setTransferring] = useState(false);
  const [transferError, setTransferError] = useState("");

  const closed = useMemo(() => {
    const s = String(ticket?.status ?? "").trim().toLowerCase();
    return s === "closed" || s === "close";
  }, [ticket?.status]);

  const internal = useMemo(() => isInternal(meUser), [meUser]);
  const canSend = !closed || internal;
  const busy = sending || closing;

  useEffect(() => {
    if (!busy) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [busy]);

  async function loadMe() {
    setMeLoading(true);
    try {
      const res = await apiFetch<{ user: MeUser }>("/auth/me");
      setMeUser(res?.user ?? null);
    } catch {
      setMeUser(null);
    } finally {
      setMeLoading(false);
    }
  }

  async function loadTicket() {
    setLoading(true);
    setError("");
    try {
      const json = await apiFetch<{ data: Ticket }>(`/portal/tickets/${ticketId}`);
      setTicket(json?.data ?? null);
      if (!json?.data) throw new Error("Ticket tidak ditemukan.");
    } catch (e: any) {
      setError(e?.message ?? "Gagal load ticket");
    } finally {
      setLoading(false);
    }
  }

  async function loadComments() {
    if (!ticketId) return;
    setCommentsLoading(true);
    try {
      const json = await apiFetch<{ comments: Comment[] }>(`/tickets/${ticketId}/comments`);
      setComments(json?.comments ?? []);
    } catch (e: any) {
      console.error(e);
    } finally {
      setCommentsLoading(false);
    }
  }

  async function loadAll() {
    await Promise.all([loadMe(), loadTicket(), loadComments()]);
  }

  useEffect(() => {
    if (!ticketId) return;
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  const meta = useMemo(() => {
    if (!ticket) return [];
    return [
      { label: "Ticket Number", value: ticket.ticket_number },
      { label: "Status", value: ticket.status },
      { label: "Priority", value: ticket.priority ?? "-" },
      { label: "Category", value: ticket.category ?? "-" },
      { label: "Inventory", value: ticket.inventory_item?.name ?? ticket.inventory_item_name ?? "-" },
      { label: "Reporter", value: ticket.reporter_name ?? ticket.user?.name ?? ticket.creator?.name ?? "-" },
      { label: "Handler", value: ticket.assignee?.name ?? "-" },
      { label: "Organization", value: ticket.organization?.name ?? "-" },
      { label: "Tagging Word", value: ticket.tagging_word || "-" },
      { label: "Requested Date", value: fmtDateShort(ticket.requested_resolution_date ?? undefined) },
      { label: "Expected Date (PS)", value: fmtDateShort(ticket.expected_date ?? undefined) },
      { label: "Created At", value: fmtDate(ticket.created_at) },
    ];
  }, [ticket]);

  const additional = useMemo(() => {
    if (!ticket) return [];
    return [
      { label: "Version", value: ticket.version ?? "-" },
      { label: "Build No", value: ticket.build_no ?? "-" },
      { label: "Patch No", value: ticket.patch_no ?? "-" },
      { label: "Module", value: ticket.module ?? "-" },
      { label: "Error Code", value: ticket.error_code ?? "-" },
      { label: "Severity", value: ticket.severity ?? "-" },
      { label: "Project", value: ticket.project ?? "-" },
      { label: "Customer", value: ticket.customer ?? "-" },
      {
        label: "Complete (PS)",
        value: ticket.complete_ps === true ? "Yes" : ticket.complete_ps === false ? "No" : "-",
      },
      { label: "Schedule Comment (PS)", value: ticket.schedule_comment ?? "-" },
    ];
  }, [ticket]);

  async function submitChat() {
    setChatError("");
    setChatFileError("");
    if (!ticketId || busy) return;
    if (!canSend) { setChatError("Ticket sudah closed."); return; }

    const text = stripHtmlToText(chatBody);
    const hasImg = hasImageTag(chatBody);
    if (!text && !hasImg && chatFiles.length === 0) {
      setChatError("Pesan wajib diisi (teks / gambar / attachment).");
      return;
    }
    if (sending) return;

    const t0 = Date.now();
    setSending(true);
    await new Promise<void>((r) => requestAnimationFrame(() => r()));

    try {
      const fd = new FormData();
      fd.append("body", chatBody);
      for (const f of chatFiles) fd.append("files[]", f);
      await apiUpload<Comment>(`/tickets/${ticketId}/comments`, fd);
      await loadComments();
      setChatBody("<p></p>");
      setChatFiles([]);
    } catch (e: any) {
      setChatError(e?.message ?? "Gagal kirim message.");
    } finally {
      const min = 500;
      const elapsed = Date.now() - t0;
      if (elapsed < min) await new Promise((r) => setTimeout(r, min - elapsed));
      setSending(false);
    }
  }

  async function closeTicket() {
    if (!ticketId || busy || closing) return;
    setCloseError("");
    if (!internal) { setCloseError("Forbidden."); return; }
    if (closed) return;
    setClosing(true);
    try {
      await apiFetch<any>(`/tickets/${ticketId}/close`, { method: "PATCH" });
      await loadTicket();
      await loadComments();
    } catch (e: any) {
      setCloseError(e?.message ?? "Gagal close ticket.");
    } finally {
      setClosing(false);
    }
  }

  async function openTransfer() {
    if (!ticketId) return;
    setTransferError("");
    setTransferTeamId("");
    setTransferNote("");
    setTransferOpen(true);
    setLoadingTargets(true);
    try {
      const res = await apiFetch<{ data: TransferTarget[] }>(`/portal/transfer-targets/${ticketId}`);
      setTransferTargets(res?.data ?? []);
    } catch (e: any) {
      setTransferTargets([]);
      setTransferError(e?.message ?? "Gagal memuat daftar team tujuan.");
    } finally {
      setLoadingTargets(false);
    }
  }

  async function submitTransfer() {
    if (!ticketId || transferring) return;
    setTransferError("");

    if (!transferTeamId) {
      setTransferError("Team tujuan wajib dipilih.");
      return;
    }
    if (!transferNote.trim()) {
      setTransferError("Catatan/alasan wajib diisi.");
      return;
    }

    setTransferring(true);
    try {
      await apiFetch(`/portal/tickets/${ticketId}/transfer`, {
        method: "PATCH",
        body: JSON.stringify({
          to_team_group_id: transferTeamId,
          note: transferNote.trim(),
        }),
      });
      setTransferOpen(false);
      await Promise.all([loadTicket(), loadComments()]);
    } catch (e: any) {
      setTransferError(e?.message ?? "Gagal transfer ticket.");
    } finally {
      setTransferring(false);
    }
  }

  /* ─── Render ─────────────────────────────────────────────────────────── */

  return (
    <>
      {busy && (
        <BusyOverlay
          title={sending ? "Sending message…" : "Closing ticket…"}
          subtitle="Please wait. Do not click again or refresh."
        />
      )}

      <div className={cn("mx-auto max-w-4xl space-y-5", busy && "pointer-events-none select-none")}>

        {/* ── Page header ── */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            {loading ? (
              <div className="space-y-2">
                <div className="h-7 w-52 animate-pulse rounded-lg bg-slate-200" />
                <div className="h-4 w-36 animate-pulse rounded bg-slate-100" />
              </div>
            ) : ticket ? (
              <>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-2xl font-bold text-slate-900">Ticket Detail</h2>
                  <StatusBadge status={ticket.status} />
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  Ticket #{ticket.ticket_number}
                </p>
              </>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={loadAll}
              disabled={busy || loading || commentsLoading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-60"
            >
              <RotateCcw className="size-4" />
              Refresh
            </button>

            {!loading && ticket?.can_transfer && !closed && (
              <button
                type="button"
                onClick={openTransfer}
                disabled={busy || transferring}
                className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 shadow-sm transition-colors hover:bg-indigo-100 disabled:opacity-60"
              >
                <Share2 className="size-4" />
                Lempar ke Team Lain
              </button>
            )}

            <button
              type="button"
              onClick={() => router.push("/portal/tickets")}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-60"
            >
              <ArrowLeft className="size-4" />
              Back
            </button>

            {!meLoading && internal && (
              <button
                type="button"
                onClick={closeTicket}
                disabled={busy || closing || closed}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-60"
              >
                {closed ? "✓ Closed" : closing ? "Closing…" : "Close Ticket"}
              </button>
            )}
          </div>
        </div>

        {/* Alerts */}
        {(error || closeError) && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <XCircle className="mt-0.5 size-4 shrink-0" />
            <span>{error || closeError}</span>
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
            Memuat ticket...
          </div>
        ) : !ticket ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
            Ticket tidak ditemukan.
          </div>
        ) : (
          <>
            {/* ── SUBJECT ── */}
            <SectionCard
              icon={<Layers2 className="size-4" />}
              iconBg="bg-teal-100"
              iconColor="text-teal-600"
              title="Subject"
            >
              <p className="text-base font-semibold text-slate-900">{ticket.subject}</p>
            </SectionCard>

            {/* ── BASIC INFORMATION ── */}
            <SectionCard
              icon={<ClipboardList className="size-4" />}
              iconBg="bg-teal-100"
              iconColor="text-teal-600"
              title="Basic Information"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {meta.map((m) => (
                  <FieldCard key={m.label} label={m.label} value={m.value} />
                ))}
              </div>
            </SectionCard>

            {/* ── ADDITIONAL INFORMATION ── */}
            <SectionCard
              icon={<Layers className="size-4" />}
              iconBg="bg-amber-100"
              iconColor="text-amber-600"
              title="Additional Information"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {additional.map((m) => (
                  <FieldCard key={m.label} label={m.label} value={m.value} />
                ))}
              </div>
            </SectionCard>

            {/* ── ISSUE DETAILS ── */}
            <SectionCard
              icon={<FileText className="size-4" />}
              iconBg="bg-green-100"
              iconColor="text-green-600"
              title="Issue Details (Description)"
            >
              <div className="min-h-[120px] rounded-xl border border-slate-200 bg-white p-4">
                <div
                  className={PROSE}
                  dangerouslySetInnerHTML={{
                    __html: ticket.description_html || "<p class='text-slate-300 italic'>Tidak ada deskripsi.</p>",
                  }}
                />
              </div>
            </SectionCard>

            {/* ── ATTACHMENTS ── */}
            <SectionCard
              icon={<Paperclip className="size-4" />}
              iconBg="bg-blue-100"
              iconColor="text-blue-600"
              title="Attachments"
            >
              {ticket.attachments?.length ? (
                <div className="space-y-2">
                  {ticket.attachments.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="size-5 shrink-0 text-slate-400" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">{a.original_name}</p>
                          <p className="text-xs text-slate-400">{fmtBytes(a.size)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => downloadWithAuth(a.download_url, a.original_name)}
                        className="ml-4 inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Download className="size-3.5" />
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">Tidak ada attachment.</p>
              )}
            </SectionCard>

            {/* ── CONVERSATION ── */}
            <SectionCard
              icon={<MessageSquare className="size-4" />}
              iconBg="bg-teal-100"
              iconColor="text-teal-600"
              title="Conversation"
              subtitle={comments.length > 0 ? `${comments.length} balasan` : undefined}
            >
              <div className="space-y-5">
                {/* Composer */}
                <div className="space-y-3">
                  {closed && !internal && (
                    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                      <span className="mt-0.5 text-base">🔒</span>
                      <span>
                        Ticket sudah <strong>Closed</strong>. Anda masih bisa melihat conversation tetapi tidak bisa mengirim pesan.
                      </span>
                    </div>
                  )}

                  <div
                    className={cn(
                      "overflow-hidden rounded-xl border border-slate-200 bg-white",
                      !canSend && "pointer-events-none opacity-60"
                    )}
                  >
                    <RichTextEditorClient value={chatBody} onChange={setChatBody} />
                  </div>

                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1">
                      <AttachmentPicker
                        files={chatFiles}
                        setFiles={setChatFiles}
                        error={chatFileError}
                        setError={setChatFileError}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={submitChat}
                      disabled={
                        busy ||
                        !canSend ||
                        sending ||
                        (stripHtmlToText(chatBody).length === 0 &&
                          !hasImageTag(chatBody) &&
                          chatFiles.length === 0)
                      }
                      className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700 disabled:opacity-60"
                    >
                      <Send className="size-4" />
                      {sending ? "Sending…" : "Send"}
                    </button>
                  </div>

                  {(chatError || chatFileError) && (
                    <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      <XCircle className="mt-0.5 size-4 shrink-0" />
                      <span>{chatError || chatFileError}</span>
                    </div>
                  )}
                </div>

                {/* Comment bubbles */}
                {commentsLoading ? (
                  <div className="py-4 text-center text-sm text-slate-400">Memuat conversation…</div>
                ) : comments.length === 0 ? (
                  <div className="py-4 text-center text-sm text-slate-400">Belum ada conversation.</div>
                ) : (
                  <div className="space-y-4">
                    {comments.map((c) => {
                      const viriya = isViriyaUser(c.user);
                      const avatarBg = viriya ? "bg-teal-500" : "bg-indigo-500";
                      const roleLabel = viriya
                        ? "VIRIYA"
                        : c.user?.organization?.trim() || "CUSTOMER";
                      const roleCls = viriya
                        ? "bg-teal-50 text-teal-600 border border-teal-200"
                        : "bg-indigo-50 text-indigo-600 border border-indigo-200";
                      const bubbleBg = viriya ? "bg-teal-50/40" : "bg-indigo-50/30";

                      return (
                        <div key={c.id} className="flex gap-3">
                          {/* Avatar */}
                          <div
                            className={cn(
                              "flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white",
                              avatarBg
                            )}
                          >
                            {nameInitials(c.user?.name)}
                          </div>

                          {/* Bubble */}
                          <div
                            className={cn(
                              "flex-1 overflow-hidden rounded-2xl border border-slate-200 p-4",
                              bubbleBg
                            )}
                          >
                            {/* Bubble header */}
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-900">
                                  {c.user?.name ?? "Unknown"}
                                </span>
                                <span
                                  className={cn(
                                    "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                                    roleCls
                                  )}
                                >
                                  {roleLabel}
                                </span>
                                {c.is_internal && (
                                  <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-600">
                                    Internal
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-slate-400">
                                {fmtDate(c.created_at)}
                              </span>
                            </div>

                            {/* Message body */}
                            <div
                              className={PROSE}
                              dangerouslySetInnerHTML={{ __html: c.body || "<p></p>" }}
                            />

                            {/* Comment attachments */}
                            {c.attachments?.length > 0 && (
                              <div className="mt-4 space-y-2">
                                {c.attachments.map((a) => {
                                  const isImg = (a.mime_type || "").toLowerCase().startsWith("image/");
                                  return (
                                    <div
                                      key={a.id}
                                      className="rounded-xl border border-slate-200 bg-white p-3"
                                    >
                                      <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                          <FileText className="size-5 shrink-0 text-slate-400" />
                                          <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-slate-900">
                                              {a.original_name}
                                            </p>
                                            <p className="text-xs text-slate-400">{fmtBytes(a.size)}</p>
                                          </div>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => downloadWithAuth(a.download_url, a.original_name)}
                                          className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                                        >
                                          <Download className="size-3.5" />
                                          Download
                                        </button>
                                      </div>
                                      {isImg && (
                                        <img
                                          src={a.download_url}
                                          alt={a.original_name}
                                          className="mt-3 max-h-60 w-full rounded-lg border object-contain"
                                          loading="lazy"
                                        />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </SectionCard>
          </>
        )}
      </div>

      {/* Dialog transfer / lempar tiket */}
      <Dialog open={transferOpen} onOpenChange={(o) => !transferring && setTransferOpen(o)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Lempar Tiket ke Team Lain</DialogTitle>
            <DialogDescription>
              Tiket akan ditugaskan ke Team Lead dari team tujuan. Semua member team tujuan akan dapat email.
            </DialogDescription>
          </DialogHeader>

          {loadingTargets ? (
            <div className="flex items-center gap-2 py-6 text-sm text-slate-400">
              <Loader2 className="size-4 animate-spin" /> Memuat daftar team…
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Team Tujuan <span className="text-red-500">*</span>
                </label>
                {transferTargets.length === 0 ? (
                  <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-400">
                    Tidak ada team tujuan yang tersedia.
                  </p>
                ) : (
                  <select
                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                    value={transferTeamId}
                    onChange={(e) => setTransferTeamId(e.target.value ? Number(e.target.value) : "")}
                  >
                    <option value="">— Pilih Team —</option>
                    {transferTargets.map((t) => (
                      <option key={t.id} value={t.id} disabled={!t.has_lead}>
                        {t.name}
                        {t.has_lead ? "" : " (tanpa Team Lead)"}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Catatan / Alasan <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="min-h-[90px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  placeholder="Jelaskan alasan tiket dilempar ke team ini…"
                  maxLength={1000}
                />
              </div>

              {transferError && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <XCircle className="mt-0.5 size-4 shrink-0" />
                  <span>{transferError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setTransferOpen(false)}
                  disabled={transferring}
                  className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-60"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={submitTransfer}
                  disabled={transferring || !transferTeamId || !transferNote.trim()}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-60"
                >
                  {transferring ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Memproses…
                    </>
                  ) : (
                    <>
                      <Share2 className="size-4" /> Lempar Tiket
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
