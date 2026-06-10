"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useAdminSearch } from "@/components/admin/AdminShell";
import { DashboardOverview } from "@/components/admin/DashboardOverview";
import { externalModules, internalModules, type AdminModule } from "@/components/admin/admin-modules";

function ModuleCard({ module }: { module: AdminModule }) {
  const Icon = module.icon;
  return (
    <Link
      href={module.href}
      className="group relative flex flex-col rounded-xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-[0_8px_30px_-12px_rgba(15,23,42,0.18)]"
    >
      <div className="mb-4 flex size-11 items-center justify-center rounded-lg bg-teal-50 text-teal-600 transition-colors group-hover:bg-teal-100">
        <Icon className="size-5" />
      </div>
      <h3 className="text-[15px] font-bold text-slate-900">{module.title}</h3>
      <p className="mt-1 line-clamp-2 text-sm text-slate-500">{module.description}</p>
      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-600">
        Buka
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  );
}

function SectionHeader({ title, badge, tone }: { title: string; badge: string; tone: "teal" | "emerald" }) {
  const badgeClass =
    tone === "teal" ? "bg-teal-100 text-teal-700" : "bg-emerald-100 text-emerald-700";
  return (
    <div className="flex items-center gap-3">
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeClass}`}>{badge}</span>
    </div>
  );
}

export default function AdminPage() {
  const { query } = useAdminSearch();

  const q = query.trim().toLowerCase();
  const matches = (m: AdminModule) =>
    !q || m.title.toLowerCase().includes(q) || m.description.toLowerCase().includes(q);

  const external = useMemo(() => externalModules.filter(matches), [q]);
  const internal = useMemo(() => internalModules.filter(matches), [q]);
  const empty = external.length === 0 && internal.length === 0;

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Pantau SLA, status tiket, dan konfigurasi sistem Kosalla secara real-time.
        </p>
      </div>

      {/* Analitik tiket & SLA — real-time (polling) */}
      <DashboardOverview />

      {/* Modul konfigurasi */}
      {external.length > 0 && (
        <section className="space-y-5">
          <SectionHeader title="Setup Eksternal" badge="Client Facing" tone="teal" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {external.map((m) => (
              <ModuleCard key={m.href} module={m} />
            ))}
          </div>
        </section>
      )}

      {internal.length > 0 && (
        <section className="space-y-5">
          <SectionHeader title="Setup Internal" badge="Team Management" tone="emerald" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {internal.map((m) => (
              <ModuleCard key={m.href} module={m} />
            ))}
          </div>
        </section>
      )}

      {empty && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <p className="text-sm text-slate-500">
            Tidak ada modul yang cocok dengan <span className="font-semibold text-slate-700">“{query}”</span>.
          </p>
        </div>
      )}
    </div>
  );
}
