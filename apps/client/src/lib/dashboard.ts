import type { Ticket } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api.kosalla.viriyadb.com";

/** Target SLA respons pertama (jam). Ubah sesuai kebijakan. */
export const SLA_TARGET_HOURS = 4;
const SLA_TARGET_MS = SLA_TARGET_HOURS * 60 * 60 * 1000;

/** Bentuk tiket dari endpoint admin (paginator Laravel) + kolom turunan. */
export type RawTicket = Ticket & {
  ticket_number?: string | null;
  /** waktu balasan staff pertama, dihitung backend (ticket_comments) */
  first_response_at?: string | null;
  /** nama orang yang membalas pertama kali */
  first_response_by?: string | null;
};

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
export async function fetchOrgTickets(orgId: number): Promise<RawTicket[]> {
  const token = getToken();
  if (!token) throw new Error("Unauthenticated");

  const res = await fetch(`${API_URL}/api/admin/organizations/${orgId}/tickets?per_page=200`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message ?? `Request failed (${res.status})`);
  return normalizeTickets(json);
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
  respondedAt: string | null;
  respondedBy: string | null; // siapa yang membalas pertama
  durationMs: number | null; // responded−created, atau elapsed (now−created) bila pending
  pending: boolean;
  breached: boolean;
};

export type DashboardMetrics = {
  total: number;
  open: number;
  closed: number;
  slices: StatusSlice[];
  avgResponseMs: number | null;
  respondedCount: number;
  withinSlaCount: number;
  breachedCount: number;
  slaPct: number | null;
  activity: ActivityRow[];
};

function ms(s?: string | null): number | null {
  if (!s) return null;
  // dukung "2026-01-27 09:34:00" (MySQL) maupun ISO
  const v = Date.parse(s.includes("T") ? s : s.replace(" ", "T"));
  return Number.isNaN(v) ? null : v;
}

export function computeMetrics(tickets: RawTicket[], now: number): DashboardMetrics {
  let closedCount = 0;

  let respondedCount = 0;
  let withinSlaCount = 0;
  let breachedCount = 0;
  let durationSum = 0;

  const rows: ActivityRow[] = [];

  for (const t of tickets) {
    if (normalizeStatus(t.status) === "closed") closedCount += 1;

    const createdMs = ms(t.created_at);
    const respondedAt = t.first_response_at ?? null;
    const respondedMs = ms(respondedAt);

    let durationMs: number | null = null;
    let pending = true;
    let breached = false;

    if (respondedMs != null && createdMs != null) {
      durationMs = respondedMs - createdMs;
      pending = false;
      respondedCount += 1;
      durationSum += durationMs;
      if (durationMs <= SLA_TARGET_MS) withinSlaCount += 1;
      else {
        breached = true;
        breachedCount += 1;
      }
    } else if (createdMs != null) {
      // belum direspons → elapsed berjalan untuk deteksi pelanggaran SLA
      durationMs = now - createdMs;
      breached = durationMs > SLA_TARGET_MS;
      if (breached) breachedCount += 1;
    }

    rows.push({
      id: t.id,
      code: t.ticket_number || `#${t.id}`,
      subject: t.subject || `Tiket #${t.id}`,
      createdAt: t.created_at ?? null,
      createdBy: t.creator?.name ?? null,
      respondedAt,
      respondedBy: t.first_response_by ?? null,
      durationMs,
      pending,
      breached,
    });
  }

  rows.sort((a, b) => (ms(b.createdAt) ?? 0) - (ms(a.createdAt) ?? 0));

  const total = tickets.length;
  const openCount = total - closedCount; // semua yang belum closed dianggap "Open"

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
    avgResponseMs: respondedCount ? durationSum / respondedCount : null,
    respondedCount,
    withinSlaCount,
    breachedCount,
    slaPct: respondedCount ? Math.round((withinSlaCount / respondedCount) * 100) : null,
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

/** "09:34" (zona waktu lokal) */
export function formatClock(s: string | null): string {
  const v = ms(s);
  if (v == null) return "—";
  return new Date(v).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}
