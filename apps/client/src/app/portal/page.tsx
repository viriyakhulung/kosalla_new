"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Ticket as TicketIcon, CheckCircle2, Timer } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatDurationShort } from "@/lib/dashboard";

type PortalTicket = {
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
  total: number;
  current_page: number;
  last_page: number;
  per_page: number;
  organization?: { id: number; name: string };
  organizations?: Array<{ id: number; name: string }>;
};

type Me = {
  id: number;
  name?: string | null;
  email?: string | null;
  master_role_id?: number | null;
  master_role?: string | null;
};

function fmtRelative(iso: string): string {
  try {
    const diffMs = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diffMs / 60_000);
    if (min < 60) return `${min} menit lalu`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h} jam lalu`;
    const d = Math.floor(h / 24);
    if (d === 1) return "Kemarin";
    if (d < 7) return `${d} hari lalu`;
    return `${Math.floor(d / 7)} minggu lalu`;
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
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize", cls)}>
      {status}
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
      <div
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-xl",
          iconBg,
          iconColor
        )}
      >
        {icon}
      </div>
      <div>
        <p className="text-3xl font-extrabold leading-tight text-slate-900">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
}

export default function PortalDashboardPage() {
  const router = useRouter();

  const [me, setMe] = useState<Me | null>(null);
  const [orgName, setOrgName] = useState("");
  const [tickets, setTickets] = useState<PortalTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const [meRes, ticketsRes] = await Promise.all([
          apiFetch<any>("/auth/me"),
          apiFetch<Paginated<PortalTicket>>("/portal/tickets?per_page=500"),
        ]);

        const meData = (meRes?.user ?? meRes?.data ?? meRes ?? null) as Me | null;
        setMe(meData);

        const data: PortalTicket[] = ticketsRes?.data ?? [];
        setTickets(data);

        const org = ticketsRes?.organization;
        if (org?.name) setOrgName(org.name);
      } catch {}
      setLoading(false);
    }
    init();
  }, []);

  const stats = useMemo(() => {
    const open = tickets.filter((t) => t.status?.toLowerCase() !== "closed").length;
    const closed = tickets.filter((t) => t.status?.toLowerCase() === "closed").length;

    let totalMs = 0;
    let count = 0;
    for (const t of tickets) {
      if (t.first_response_at && t.created_at) {
        const ms = new Date(t.first_response_at).getTime() - new Date(t.created_at).getTime();
        if (ms > 0) {
          totalMs += ms;
          count++;
        }
      }
    }

    return {
      open,
      closed,
      avgResponseMs: count > 0 ? totalMs / count : null,
    };
  }, [tickets]);

  const recentTickets = useMemo(
    () =>
      [...tickets]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 4),
    [tickets]
  );

  const firstName = me?.name?.trim().split(/\s+/)[0] ?? "Anda";

  const todayStr = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Halo, {firstName}</h2>
        <p className="mt-1 text-sm text-slate-500">
          {orgName && <>{orgName} · </>}
          {todayStr}
        </p>
      </div>

      {/* 3 Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={<TicketIcon className="size-5" />}
          iconBg="bg-teal-50"
          iconColor="text-teal-600"
          value={loading ? "…" : String(stats.open)}
          label="Open Tickets"
        />
        <StatCard
          icon={<CheckCircle2 className="size-5" />}
          iconBg="bg-rose-50"
          iconColor="text-rose-500"
          value={loading ? "…" : String(stats.closed)}
          label="Closed"
        />
        <StatCard
          icon={<Timer className="size-5" />}
          iconBg="bg-sky-50"
          iconColor="text-sky-600"
          value={loading ? "…" : formatDurationShort(stats.avgResponseMs)}
          label="Avg. Response"
        />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Recent Tickets */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Tiket Terbaru</h3>
              <p className="text-xs text-slate-400">Aktivitas tiket Anda paling baru</p>
            </div>
            <button
              onClick={() => router.push("/portal/tickets")}
              className="text-xs font-medium text-teal-600 hover:underline whitespace-nowrap"
            >
              Lihat semua →
            </button>
          </div>

          {loading ? (
            <div className="py-6 text-center text-sm text-slate-400">Memuat...</div>
          ) : recentTickets.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">
              <div className="mb-2 text-2xl">📭</div>
              Belum ada tiket.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentTickets.map((t) => (
                <div
                  key={t.id}
                  className="flex cursor-pointer items-center gap-3 px-1 py-3 rounded hover:bg-slate-50 transition-colors"
                  onClick={() => router.push(`/portal/tickets/${t.id}`)}
                >
                  <span className="w-[96px] shrink-0 font-mono text-xs font-semibold text-slate-500">
                    {t.ticket_number}
                  </span>
                  <span className="flex-1 truncate text-sm font-medium text-slate-800">
                    {t.subject}
                  </span>
                  <StatusBadge status={t.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-bold text-slate-900">Aksi Cepat</h3>
          <div className="space-y-2">
            <button
              onClick={() => router.push("/portal/tickets/new")}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
            >
              + Buat Tiket Baru
            </button>
            <button
              onClick={() => router.push("/portal/tutorial")}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              📖 Buka Knowledge Base
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
