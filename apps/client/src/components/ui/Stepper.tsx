"use client";

import React from "react";
import { Check } from "lucide-react";

export type Step = { id: string; label: string };

/**
 * Stepper indikator langkah sederhana (tanpa library tambahan).
 * Menampilkan nomor/checkmark + label dengan status aktif/selesai/menunggu.
 * Reusable untuk wizard lain di masa depan.
 */
export function Stepper({
  steps,
  currentIndex,
  className = "",
}: {
  steps: Step[];
  currentIndex: number;
  className?: string;
}) {
  return (
    <ol className={"flex flex-wrap items-center gap-2 " + className}>
      {steps.map((s, i) => {
        const state =
          i < currentIndex ? "done" : i === currentIndex ? "active" : "todo";
        return (
          <li key={s.id} className="flex items-center gap-2">
            <span
              className={
                "flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors " +
                (state === "active"
                  ? "bg-teal-600 text-white"
                  : state === "done"
                  ? "bg-teal-100 text-teal-700"
                  : "bg-slate-100 text-slate-400")
              }
            >
              {state === "done" ? <Check className="size-4" /> : i + 1}
            </span>
            <span
              className={
                "text-sm " +
                (state === "active"
                  ? "font-semibold text-slate-900"
                  : state === "done"
                  ? "font-medium text-slate-600"
                  : "text-slate-400")
              }
            >
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <span className="mx-1 h-px w-6 bg-slate-200" aria-hidden />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export default Stepper;
