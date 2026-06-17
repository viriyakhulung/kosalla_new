"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Inbox,
  Info,
  PlusCircle,
  RefreshCw,
  Ticket as TicketIcon,
  Timer,
} from "lucide-react";
import {
  buildMetrics,
  exportOrgTickets,
  fetchOrgTickets,
  formatClock,
  formatDurationShort,
  formatHours,
  type StatusSlice,
} from "@/lib/dashboard";
import { getOrganizations } from "@/lib/organizations";
import { cn } from "@/lib/utils";
import { StatusDonut } from "./StatusDonut";

const REFRESH_MS = 10_000;
const ORG_KEY = "kosalla_admin_dash_org";
const PAGE_SIZE = 6;

export function DashboardOverview() {
  const [orgId, setOrgId] = useState<number | null>(null);
  const [page, setPage] = useState(0);

  // filter export (tanggal created_at + status)
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const dateError = from !== "" && to !== "" && from > to;

  // daftar organisasi untuk selector
  const orgsQuery = useQuery({
    queryKey: ["admin-organizations"],
    queryFn: getOrganizations,
    staleTime: 5 * 60_000,
  });
  const orgs = orgsQuery.data ?? [];

  // restore pilihan tersimpan, lalu auto-pilih org pertama bila belum ada
  useEffect(() => {
    if (orgId != null || orgs.length === 0) return;
    const saved = typeof window !== "undefined" ? Number(localStorage.getItem(ORG_KEY)) : NaN;
    const exists = orgs.some((o) => o.id === saved);
    setOrgId(exists ? saved : orgs[0].id);
  }, [orgs, orgId]);

  function chooseOrg(id: number) {
    setOrgId(id);
    if (typeof window !== "undefined") localStorage.setItem(ORG_KEY, String(id));
  }

  async function handleExport() {
    if (orgId == null || dateError) return;
    setExporting(true);
    setExportError("");
    try {
      const today = new Date().toISOString().slice(0, 10);
      await exportOrgTickets(
        orgId,
        { from: from || undefined, to: to || undefined, status: statusFilter || undefined },
        `report-tiket-${orgId}-${today}.xlsx`
      );
    } catch (e: any) {
      setExportError(e?.message ?? "Gagal export report.");
    } finally {
      setExporting(false);
    }
  }

  // tiket org terpilih — polling real-time
  const { data, isLoading, isError, error, isFetching, dataUpdatedAt, refetch } = useQuery({
    queryKey: ["admin-dashboard-tickets", orgId],
    queryFn: () => fetchOrgTickets(orgId as number),
    enabled: orgId != null,
    refetchInterval: REFRESH_MS,
    refetchOnWindowFocus: true,
    staleTime: 5_000,
  });

  const metrics = useMemo(
    () => buildMetrics(data ?? { tickets: [], summary: null }),
    [data]
  );

  const updatedLabel = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "—";
  const busy = isLoading || orgId == null;

  // reset halaman saat ganti organisasi
  useEffect(() => setPage(0), [orgId]);

  // pagination tabel aktivitas
  const totalRows = metrics.activity.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageRows = metrics.activity.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const rangeStart = totalRows === 0 ? 0 : safePage * PAGE_SIZE + 1;
  const rangeEnd = Math.min(rangeStart + PAGE_SIZE - 1, totalRows);

  return (
    <section className="space-y-5">
      {/* header: org selector + live */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* organization selector */}
          <div className="relative">
            <Building2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <select
              value={orgId ?? ""}
              onChange={(e) => chooseOrg(Number(e.target.value))}
              disabled={orgsQuery.isLoading || orgs.length === 0}
              className="h-9 appearance-none rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-sm font-semibold text-slate-700 outline-none transition-colors hover:bg-slate-50 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 disabled:opacity-60"
            >
              {orgsQuery.isLoading && <option value="">Memuat organisasi…</option>}
              {!orgsQuery.isLoading && orgs.length === 0 && <option value="">Belum ada organisasi</option>}
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
            <svg className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-2 animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            <span className="font-medium text-slate-600">Real-time</span>
            <span className="hidden text-slate-400 sm:inline">· diperbarui {updatedLabel}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* filter export: tanggal created_at + status */}
          <input
            type="date"
            value={from}
            max={to || undefined}
            onChange={(e) => setFrom(e.target.value)}
            aria-label="Dari tanggal"
            className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-600 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
          />
          <span className="text-xs text-slate-400">s/d</span>
          <input
            type="date"
            value={to}
            min={from || undefined}
            onChange={(e) => setTo(e.target.value)}
            aria-label="Sampai tanggal"
            className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-600 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter status"
            className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-600 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
          >
            <option value="">Semua status</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
          <button
            onClick={handleExport}
            disabled={orgId == null || exporting || dateError}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3 text-xs font-semibold text-teal-700 transition-colors hover:bg-teal-100 disabled:opacity-50"
          >
            <Download className={cn("size-3.5", exporting && "animate-pulse")} />
            {exporting ? "Menyiapkan…" : "Export Excel"}
          </button>
          <button
            onClick={() => refetch()}
            disabled={orgId == null}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={cn("size-3.5", isFetching && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      {(dateError || exportError) && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-700">
          {dateError ? "Tanggal 'Dari' tidak boleh setelah 'Sampai'." : exportError}
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Gagal memuat data tiket: {(error as Error)?.message ?? "unknown error"}
        </div>
      )}
      {orgsQuery.isError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Gagal memuat daftar organisasi: {(orgsQuery.error as Error)?.message ?? "unknown error"}
        </div>
      )}

      {/* stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={<TicketIcon className="size-5" />} tone="slate" value={metrics.total} label="Total Tiket" loading={busy} />
        <StatCard icon={<Inbox className="size-5" />} tone="emerald" value={metrics.open} label="Open" loading={busy} />
        <StatCard icon={<CheckCircle2 className="size-5" />} tone="rose" value={metrics.closed} label="Closed" loading={busy} />
        <StatCard
          icon={<Timer className="size-5" />}
          tone="teal"
          value={formatDurationShort(metrics.avgResolutionMs)}
          label="Avg. Penyelesaian"
          loading={busy}
        />
      </div>

      {/* main grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* donut */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Status Tiket</h3>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-500">
              Real-time
            </span>
          </div>
          <StatusDonut slices={metrics.slices} total={metrics.total} />
          <ul className="mt-4 space-y-2">
            {metrics.slices.map((s) => (
              <LegendRow key={s.key} slice={s} total={metrics.total} />
            ))}
          </ul>
        </div>

        {/* SLA + activity */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2">
          <h3 className="text-sm font-bold text-slate-900">Waktu Penyelesaian (SLA)</h3>
          <div className="mt-2 flex items-end gap-3">
            <span className="text-3xl font-extrabold leading-none text-slate-900">
              {formatHours(metrics.avgResolutionMs)}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Rata-rata waktu penyelesaian (dibuat → closed) · target SLA {metrics.targetHours} jam
          </p>

          {/* SLA progress (proporsi dalam SLA) */}
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                (metrics.slaPct ?? 0) >= 80 ? "bg-emerald-500" : (metrics.slaPct ?? 0) >= 50 ? "bg-amber-500" : "bg-rose-500"
              )}
              style={{ width: `${metrics.slaPct ?? 0}%` }}
            />
          </div>
          <div className="mt-3 flex items-center gap-6">
            <div>
              <span className="text-lg font-bold text-emerald-600">
                {metrics.slaPct != null ? `${metrics.slaPct}%` : "—"}
              </span>
              <span className="ml-1.5 text-xs text-slate-500">dalam SLA</span>
            </div>
            <div>
              <span className="text-lg font-bold text-rose-600">{metrics.breachedCount}</span>
              <span className="ml-1.5 text-xs text-slate-500">melebihi SLA</span>
            </div>
          </div>

          {/* penjelasan SLA */}
          <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-500">
            <Info className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
            <span>
              <b className="font-semibold text-slate-600">Lewat SLA</b> = waktu penyelesaian (dibuat → closed) melebihi target{" "}
              {metrics.targetHours} jam. Tiket yang <b className="font-semibold text-slate-600">belum closed</b> dihitung dari
              lama berjalan sejak dibuat — jadi tiket lama yang belum selesai otomatis “Lewat SLA”.
            </span>
          </p>

          {/* real-time activity */}
          <h4 className="mt-5 mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
            Aktivitas Real-time
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  <th className="py-2 pr-3 font-semibold">Tiket</th>
                  <th className="py-2 pr-3 font-semibold">Dibuat</th>
                  <th className="py-2 pr-3 font-semibold">Ditutup</th>
                  <th className="py-2 pr-3 font-semibold">Durasi</th>
                  <th className="py-2 font-semibold">SLA</th>
                </tr>
              </thead>
              <tbody>
                {busy && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      Memuat…
                    </td>
                  </tr>
                )}
                {!busy && metrics.activity.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      Belum ada tiket di organisasi ini.
                    </td>
                  </tr>
                )}
                {!busy &&
                  pageRows.map((row) => (
                    <tr key={row.id} className="border-b border-slate-100 align-top last:border-0">
                      <td className="py-3 pr-3">
                        <p className="font-semibold text-slate-700">{row.code}</p>
                        <p className="max-w-[180px] truncate text-xs text-slate-400">{row.subject}</p>
                      </td>
                      <td className="py-3 pr-3">
                        <span className="inline-flex items-center gap-1.5 text-slate-600">
                          <PlusCircle className="size-3.5 text-slate-400" />
                          {formatClock(row.createdAt)}
                        </span>
                        {row.createdBy && (
                          <p className="mt-0.5 max-w-[130px] truncate text-xs text-slate-400">{row.createdBy}</p>
                        )}
                      </td>
                      <td className="py-3 pr-3">
                        {row.closedAt ? (
                          <>
                            <span className="inline-flex items-center gap-1.5 text-slate-600">
                              <CheckCircle2 className="size-3.5 text-slate-400" />
                              {formatClock(row.closedAt)}
                            </span>
                            <p className="mt-0.5 max-w-[130px] truncate text-xs text-slate-400">
                              {row.closedBy ?? "—"}
                            </p>
                          </>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-3 text-slate-600">{formatDurationShort(row.durationMs)}</td>
                      <td className="py-3">
                        <SlaBadge pending={row.pending} breached={row.breached} />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* pagination */}
          {!busy && totalRows > 0 && (
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span>
                {rangeStart}–{rangeEnd} dari {totalRows} tiket
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(safePage - 1)}
                  disabled={safePage <= 0}
                  className="inline-flex size-7 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent"
                  aria-label="Sebelumnya"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <span className="tabular-nums">
                  {safePage + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(safePage + 1)}
                  disabled={safePage >= totalPages - 1}
                  className="inline-flex size-7 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent"
                  aria-label="Berikutnya"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------------- small pieces ---------------- */

const TONES: Record<string, string> = {
  slate: "bg-slate-100 text-slate-600",
  emerald: "bg-emerald-50 text-emerald-600",
  rose: "bg-rose-50 text-rose-600",
  amber: "bg-amber-50 text-amber-600",
  teal: "bg-teal-50 text-teal-600",
};

function StatCard({
  icon,
  tone,
  value,
  label,
  loading,
}: {
  icon: React.ReactNode;
  tone: keyof typeof TONES | string;
  value: React.ReactNode;
  label: string;
  loading?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg", TONES[tone] ?? TONES.slate)}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xl font-extrabold leading-tight text-slate-900">{loading ? "…" : value}</p>
        <p className="truncate text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function LegendRow({ slice, total }: { slice: StatusSlice; total: number }) {
  const pct = total > 0 ? Math.round((slice.count / total) * 100) : 0;
  return (
    <li className="flex items-center gap-2 text-sm">
      <span className="size-2.5 shrink-0 rounded-sm" style={{ backgroundColor: slice.color }} />
      <span className="flex-1 text-slate-600">{slice.label}</span>
      <span className="font-semibold text-slate-800">{slice.count}</span>
      <span className="w-9 text-right text-xs text-slate-400">{pct}%</span>
    </li>
  );
}

function SlaBadge({ pending, breached }: { pending: boolean; breached: boolean }) {
  if (breached) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600">
        <span className="size-1.5 rounded-full bg-rose-500" />
        Lewat SLA
      </span>
    );
  }
  if (pending) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600">
        <span className="size-1.5 rounded-full bg-amber-500" />
        Belum selesai
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
      <span className="size-1.5 rounded-full bg-emerald-500" />
      Tepat waktu
    </span>
  );
}
