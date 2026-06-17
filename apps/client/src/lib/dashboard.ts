import type { Ticket } from "@/types";
import { downloadWithAuth } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api.kosalla.viriyadb.com";

/** Bentuk tiket dari endpoint admin (paginator Laravel) + kolom turunan. */
export type RawTicket = Ticket & {
  ticket_number?: string | null;
  /** waktu tiket di-close (kolom tickets.closed_at) — dasar perhitungan SLA */
  closed_at?: string | null;
  /** waktu tiket di-resolve (kolom tickets.resolved_at) */
  resolved_at?: string | null;
  /** nama user yang menutup tiket (field turunan dari adminIndex: closedBy?->name) */
  closed_by_name?: string | null;
  /** durasi SLA (ms) — dihitung backend (TicketSlaService) */
  duration_ms?: number | null;
  /** status SLA per tiket — dihitung backend: within | breached | pending */
  sla_status?: "within" | "breached" | "pending" | null;
};

/** Ringkasan SLA agregat dari backend (TicketSlaService::summary). */
export type SlaSummary = {
  total: number;
  open: number;
  closed: number;
  resolved_count: number;
  within_sla: number;
  breached_sla: number;
  avg_ms: number | null;
  sla_pct: number | null;
  target_hours: number;
};

/** Paket data dashboard: baris tiket + ringkasan SLA (sumber kebenaran backend). */
export type DashboardData = { tickets: RawTicket[]; summary: SlaSummary | null };

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("kosalla_token");
}

function normalizeTickets(json: any): RawTicket[] {
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.data)) return json.data; // Laravel paginator
  if (Array.isArray(json?.data?.data)) return json.data.data;
  return [];
}

/**
 * Ambil tiket untuk SATU organisasi (dipilih superadmin).
 * Endpoint: GET /api/admin/organizations/{orgId}/tickets
 */
export async function fetchOrgTickets(orgId: number): Promise<DashboardData> {
  const token = getToken();
  if (!token) throw new Error("Unauthenticated");

  const res = await fetch(`${API_URL}/api/admin/organizations/${orgId}/tickets?per_page=200`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message ?? `Request failed (${res.status})`);
  return {
    tickets: normalizeTickets(json),
    summary: (json?.sla_summary as SlaSummary | undefined) ?? null,
  };
}

/**
 * Export report tiket 1 organisasi ke .xlsx (filter tanggal + status).
 * Pakai downloadWithAuth() (Bearer → blob → anchor). Nama file wajib di-set
 * di FE karena download via blob memakai atribut anchor (Content-Disposition diabaikan).
 */
export async function exportOrgTickets(
  orgId: number,
  opts: { from?: string; to?: string; status?: string },
  filename: string
): Promise<void> {
  const qs = new URLSearchParams();
  if (opts.from) qs.set("from", opts.from);
  if (opts.to) qs.set("to", opts.to);
  if (opts.status) qs.set("status", opts.status);

  const url = `${API_URL}/api/admin/organizations/${orgId}/tickets/export${
    qs.toString() ? `?${qs.toString()}` : ""
  }`;
  await downloadWithAuth(url, filename);
}

/* ------------------------------------------------------------------ */
/*  Metrics                                                            */
/* ------------------------------------------------------------------ */

export type StatusKey = "open" | "in_progress" | "resolved" | "closed";

export const STATUS_META: Record<StatusKey, { label: string; color: string }> = {
  open: { label: "Open", color: "#10b981" },
  in_progress: { label: "In Progress", color: "#3b82f6" },
  resolved: { label: "Resolved", color: "#f59e0b" },
  closed: { label: "Closed", color: "#ef4444" },
};

function normalizeStatus(s?: string | null): StatusKey {
  const key = String(s ?? "open").replace(/-/g, "_") as StatusKey;
  return key in STATUS_META ? key : "open";
}

export type StatusSlice = { key: StatusKey; label: string; color: string; count: number };

export type ActivityRow = {
  id: number;
  code: string; // ticket_number atau #id
  subject: string;
  createdAt: string | null;
  createdBy: string | null; // siapa yang membuat
  closedAt: string | null; // waktu tiket di-close (null bila belum)
  closedBy: string | null; // siapa yang menutup (null bila belum/data lama)
  durationMs: number | null; // closed−created, atau elapsed (now−created) bila belum closed
  pending: boolean; // true = belum closed
  breached: boolean;
};

export type DashboardMetrics = {
  total: number;
  open: number;
  closed: number;
  slices: StatusSlice[];
  avgResolutionMs: number | null;
  resolvedCount: number; // jumlah tiket closed dengan closed_at valid
  withinSlaCount: number;
  breachedCount: number;
  slaPct: number | null;
  targetHours: number;
  activity: ActivityRow[];
};

function ms(s?: string | null): number | null {
  if (!s) return null;
  // dukung "2026-01-27 09:34:00" (MySQL) maupun ISO
  const v = Date.parse(s.includes("T") ? s : s.replace(" ", "T"));
  return Number.isNaN(v) ? null : v;
}

/**
 * Bangun objek metrik dashboard dari data backend.
 *
 * SLA tidak lagi dihitung di FE — semua angka (durasi, klasifikasi, agregat)
 * berasal dari TicketSlaService di backend (sumber kebenaran tunggal).
 * FE hanya memetakan & memformat.
 */
export function buildMetrics(data: DashboardData): DashboardMetrics {
  const tickets = data.tickets ?? [];
  const s = data.summary;

  const rows: ActivityRow[] = tickets.map((t) => {
    const status = t.sla_status ?? null;
    return {
      id: t.id,
      code: t.ticket_number || `#${t.id}`,
      subject: t.subject || `Tiket #${t.id}`,
      createdAt: t.created_at ?? null,
      createdBy: t.creator?.name ?? null,
      closedAt: t.closed_at ?? null,
      closedBy: t.closed_by_name ?? null,
      durationMs: t.duration_ms ?? null,
      pending: status === "pending",
      breached: status === "breached",
    };
  });

  rows.sort((a, b) => (ms(b.createdAt) ?? 0) - (ms(a.createdAt) ?? 0));

  const total = s?.total ?? tickets.length;
  const openCount = s?.open ?? 0;
  const closedCount = s?.closed ?? 0;

  // Hanya dua status: Open & Closed
  const slices: StatusSlice[] = [
    { key: "open", label: "Open", color: STATUS_META.open.color, count: openCount },
    { key: "closed", label: "Closed", color: STATUS_META.closed.color, count: closedCount },
  ];

  return {
    total,
    open: openCount,
    closed: closedCount,
    slices,
    avgResolutionMs: s?.avg_ms ?? null,
    resolvedCount: s?.resolved_count ?? 0,
    withinSlaCount: s?.within_sla ?? 0,
    breachedCount: s?.breached_sla ?? 0,
    slaPct: s?.sla_pct ?? null,
    targetHours: s?.target_hours ?? 4,
    activity: rows,
  };
}

/* ------------------------------------------------------------------ */
/*  Formatters                                                        */
/* ------------------------------------------------------------------ */

/** "2.4 jam" / "45 mnt" */
export function formatHours(msVal: number | null): string {
  if (msVal == null) return "—";
  const h = msVal / 3_600_000;
  if (h < 1) return `${Math.round(msVal / 60_000)} mnt`;
  return `${h.toFixed(1)} jam`;
}

/** kompak untuk kartu/tabel: "2.4j" / "22 mnt" / "1j 18m" */
export function formatDurationShort(msVal: number | null): string {
  if (msVal == null) return "—";
  const totalMin = Math.round(msVal / 60_000);
  if (totalMin < 60) return `${totalMin} mnt`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m ? `${h}j ${m}m` : `${h} jam`;
}

/** "10/06/2026 14.09" (DD/MM/YYYY HH.MM, zona waktu lokal) */
export function formatClock(s: string | null): string {
  const v = ms(s);
  if (v == null) return "—";
  const d = new Date(v);
  const pad = (n: number) => String(n).padStart(2, "0");
  const dd = pad(d.getDate());
  const mm = pad(d.getMonth() + 1);
  const yyyy = d.getFullYear();
  const hh = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${dd}/${mm}/${yyyy} ${hh}.${min}`;
}
