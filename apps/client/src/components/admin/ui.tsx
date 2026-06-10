"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/* Input / select base style */
export const adminInput =
  "h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 " +
  "placeholder-slate-400 transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 disabled:opacity-60";

/* Primary (teal) button */
export const adminPrimaryBtn =
  "inline-flex items-center justify-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed";

/* Outline button (Edit / secondary) */
export const adminGhostBtn =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60";

type Tone = "teal" | "amber" | "sky" | "emerald" | "rose" | "slate" | "blue";

const TONES: Record<Tone, string> = {
  teal: "bg-teal-50 text-teal-600",
  amber: "bg-amber-50 text-amber-600",
  sky: "bg-sky-50 text-sky-600",
  emerald: "bg-emerald-50 text-emerald-600",
  rose: "bg-rose-50 text-rose-600",
  slate: "bg-slate-100 text-slate-600",
  blue: "bg-blue-50 text-blue-600",
};

export function PageHead({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
          {icon}
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>
      </div>
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-600 transition-colors hover:text-teal-700"
      >
        <ArrowLeft className="size-4" />
        Back to Admin
      </Link>
    </div>
  );
}

export function StatCard({
  icon,
  tone = "teal",
  value,
  label,
}: {
  icon: React.ReactNode;
  tone?: Tone;
  value: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", TONES[tone])}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-extrabold leading-tight text-slate-900">{value}</p>
        <p className="truncate text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
}

export function SectionCard({
  icon,
  iconTone = "teal",
  title,
  subtitle,
  action,
  children,
}: {
  icon?: React.ReactNode;
  iconTone?: Tone;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        {icon && (
          <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", TONES[iconTone])}>
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-600">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
    </div>
  );
}

/* Small round icon avatar for list rows */
export function RowIcon({ icon, tone = "teal" }: { icon: React.ReactNode; tone?: Tone }) {
  return (
    <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", TONES[tone])}>
      {icon}
    </div>
  );
}
