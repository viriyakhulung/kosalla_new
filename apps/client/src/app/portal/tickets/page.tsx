"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Ticket as TicketIcon, CheckCircle2, Timer } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatDurationShort } from "@/lib/dashboard";

type Ticket = {
  id: number;
  ticket_number: string;
  subject: string;
  status: string;
  created_at: string;
  first_response_at?: string | null;
  priority?: string | null;
  inventory_item?: { id: number; name: string } | null;
  inventory_item_name?: string | null;
  category?: string | null;
};

type Paginated<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  organization?: { id: number; name: string };
  organizations?: Array<{ id: number; name: string }>;
};

function fmtDate(iso: string) {
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

function StatusBadge({ status }: { status: string }) {
  const s = status?.toLowerCase();
  const cls =
    s === "closed"
      ? "bg-red-100 text-red-700"
      : s === "open"
      ? "bg-green-100 text-green-700"
      : s === "pending"
      ? "bg-yellow-100 text-yellow-700"
      : "bg-blue-100 text-blue-700";
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", cls)}>
      • {status}
    </span>
  );
}

function StatCard({
  icon,
  iconBg,
  iconColor,
  value,
  label,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", iconBg, iconColor)}>
        {icon}
      </div>
      <div>
        <p className="text-3xl font-extrabold leading-tight text-slate-900">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
}

export default function TicketHistoryPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState("");

  // Paginated table data
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Filters
  const [q, setQ] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "open" | "closed">("all");
  const [orgId, setOrgId] = useState<number | "">("");
  const [orgName, setOrgName] = useState("-");
  const [orgOptions, setOrgOptions] = useState<Array<{ id: number; name: string }>>([]);

  // Stats (from full ticket list)
  const [statsData, setStatsData] = useState<{
    open: number;
    closed: number;
    avgResponseMs: number | null;
  }>({ open: 0, closed: 0, avgResponseMs: null });

  const didInitRef = useRef(false);

  // Load stats from full ticket list untuk org yang sedang dipilih.
  // PENTING: kirim org_id supaya kartu & tab counts sinkron dengan tabel,
  // bukan nyangkut di organisasi pribadi user (relevan untuk viriyastaff).
  async function loadStats(org?: number | "") {
    const _orgId = org !== undefined ? org : orgId;
    setStatsLoading(true);
    try {
      const qs = new URLSearchParams();
      qs.set("per_page", "500");
      if (_orgId !== "") qs.set("org_id", String(_orgId));

      const json = await apiFetch<Paginated<Ticket>>(`/portal/tickets?${qs.toString()}`);
      const all: Ticket[] = json?.data ?? [];

      const open = all.filter((t) => t.status?.toLowerCase() !== "closed").length;
      const closed = all.filter((t) => t.status?.toLowerCase() === "closed").length;

      let totalMs = 0;
      let count = 0;
      for (const t of all) {
        if (t.first_response_at && t.created_at) {
          const ms =
            new Date(t.first_response_at).getTime() - new Date(t.created_at).getTime();
          if (ms > 0) {
            totalMs += ms;
            count++;
          }
        }
      }

      setStatsData({
        open,
        closed,
        avgResponseMs: count > 0 ? totalMs / count : null,
      });
    } catch {}
    setStatsLoading(false);
  }

  // Load paginated ticket table — accepts explicit params to avoid stale closure issues
  async function loadTickets(opts: {
    tab?: "all" | "open" | "closed";
    page?: number;
    rows?: number;
    search?: string;
    org?: number | "";
  } = {}) {
    const _tab = opts.tab ?? activeTab;
    const _page = opts.page ?? currentPage;
    const _perPage = opts.rows ?? perPage;
    const _q = opts.search ?? q;
    const _orgId = opts.org !== undefined ? opts.org : orgId;

    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams();
      qs.set("per_page", String(_perPage));
      qs.set("page", String(_page));
      if (_tab !== "all") qs.set("status", _tab);
      if (_q.trim()) qs.set("q", _q.trim());
      if (_orgId !== "") qs.set("org_id", String(_orgId));

      const json = await apiFetch<Paginated<Ticket>>(`/portal/tickets?${qs.toString()}`);
      setTickets(json?.data ?? []);
      setTotalPages(json?.last_page ?? 1);

      const activeOrg = json?.organization ?? null;
      const orgs = json?.organizations ?? [];
      setOrgOptions(orgs);

      if (activeOrg?.id) {
        setOrgId(activeOrg.id);
        setOrgName(activeOrg.name ?? "-");
      } else if (orgs.length > 0 && _orgId === "") {
        setOrgId(orgs[0].id);
        setOrgName(orgs[0].name ?? "-");
      } else if (orgs.length === 0) {
        setOrgName("-");
      }
    } catch (e: any) {
      setError(e?.message ?? "Gagal memuat tiket");
    } finally {
      setLoading(false);
    }
  }

  // Tab change: reset page to 1 and reload immediately with new tab
  function handleTabChange(tab: "all" | "open" | "closed") {
    setActiveTab(tab);
    setCurrentPage(1);
    loadTickets({ tab, page: 1 });
  }

  // Init: load stats + tickets in parallel
  useEffect(() => {
    Promise.all([loadStats(), loadTickets()]).finally(() => {
      didInitRef.current = true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!didInitRef.current) return;
    if (orgId === "") return;
    loadTickets({ org: orgId });
    loadStats(orgId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  useEffect(() => {
    if (!didInitRef.current) return;
    loadTickets({ page: currentPage, rows: perPage });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, perPage]);

  // Client-side search filter
  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return tickets.filter((t) => {
      if (!qq) return true;
      return (
        t.subject?.toLowerCase().includes(qq) ||
        String(t.id).includes(qq) ||
        t.ticket_number?.toLowerCase().includes(qq)
      );
    });
  }, [tickets, q]);

  // Tab counts (from stats data)
  const tabCounts = {
    all: statsData.open + statsData.closed,
    open: statsData.open,
    closed: statsData.closed,
  };

  return (
    <div className="space-y-5">
      {/* 3 Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={<TicketIcon className="size-5" />}
          iconBg="bg-teal-50"
          iconColor="text-teal-600"
          value={statsLoading ? "…" : String(statsData.open)}
          label="Open Tickets"
        />
        <StatCard
          icon={<CheckCircle2 className="size-5" />}
          iconBg="bg-rose-50"
          iconColor="text-rose-500"
          value={statsLoading ? "…" : String(statsData.closed)}
          label="Closed"
        />
        <StatCard
          icon={<Timer className="size-5" />}
          iconBg="bg-sky-50"
          iconColor="text-sky-600"
          value={statsLoading ? "…" : formatDurationShort(statsData.avgResponseMs)}
          label="Avg. Response"
        />
      </div>

      {/* Search + Org filter + Refresh */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:flex-wrap">
            <input
              className="w-full md:w-[280px] lg:w-[360px] rounded-lg border border-slate-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all placeholder-slate-400"
              placeholder="Search by Ticket #, Subject..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />

            {orgOptions.length > 0 ? (
              <select
                className="w-full md:w-[200px] rounded-lg border border-slate-300 px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                value={orgId === "" ? "" : String(orgId)}
                onChange={(e) => {
                  const val = e.target.value;
                  setOrgId(val ? Number(val) : "");
                }}
              >
                <option value="">All Organizations</option>
                {orgOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            ) : (
              orgName !== "-" && (
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 font-medium">
                  🏢 {orgName}
                </div>
              )
            )}
          </div>

          <button
            type="button"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-60"
            onClick={() => loadTickets()}
            disabled={loading}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Ticket table card */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Tabs + per-page */}
        <div className="border-b border-slate-200 px-5 pt-4 pb-0 flex items-end justify-between gap-4">
          <div className="flex gap-1">
            {(["all", "open", "closed"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
                  activeTab === tab
                    ? "border-teal-600 text-teal-700"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                )}
              >
                <span className="capitalize">{tab === "all" ? "All" : tab === "open" ? "Open" : "Closed"}</span>
                {!statsLoading && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-xs font-semibold",
                      activeTab === tab
                        ? "bg-teal-100 text-teal-700"
                        : "bg-slate-100 text-slate-500"
                    )}
                  >
                    {tabCounts[tab]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {tickets.length > 0 && (
            <div className="flex items-center gap-2 pb-2">
              <label className="text-xs text-slate-500">Show</label>
              <select
                className="rounded border border-slate-300 px-2 py-1 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value))}
              >
                {[10, 20, 50, 100].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 text-sm text-red-700 bg-red-50 border-b border-red-200">
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <div className="p-10 text-center text-sm text-slate-400">Memuat tiket...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">
            <div className="mb-2 text-3xl">📭</div>
            Belum ada tiket.
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide">Ticket ID</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide">Subject</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide">Priority</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide">Item</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide">Created</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr
                    key={t.id}
                    className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/portal/tickets/${t.id}`)}
                  >
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-slate-600">
                      {t.ticket_number}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-900 max-w-[200px] truncate">
                      {t.subject}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {t.priority ? (
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                            t.priority?.toLowerCase() === "high"
                              ? "bg-red-100 text-red-700"
                              : t.priority?.toLowerCase() === "medium"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-slate-100 text-slate-600"
                          )}
                        >
                          {t.priority}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 text-xs">
                      {t.inventory_item?.name ??
                        t.inventory_item_name ??
                        t.category ?? (
                          <span className="text-slate-400 italic">—</span>
                        )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs whitespace-nowrap">
                      {fmtDate(t.created_at)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-slate-400 text-base">›</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 flex items-center justify-center gap-1.5">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                  currentPage === page
                    ? "bg-teal-600 text-white shadow-sm"
                    : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-100"
                )}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
