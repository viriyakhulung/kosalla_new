"use client";

import React from "react";
import { Check, Lock } from "lucide-react";

export type StepState = "done" | "active" | "todo" | "locked";
export type Step = { id: string; label: string };

const BADGE: Record<StepState, { text: string; cls: string }> = {
  done: { text: "DONE", cls: "bg-teal-100 text-teal-700" },
  active: { text: "IN PROGRESS", cls: "bg-amber-100 text-amber-700" },
  todo: { text: "TODO", cls: "bg-slate-100 text-slate-400" },
  locked: { text: "LOCKED", cls: "bg-slate-100 text-slate-400" },
};

const CIRCLE: Record<StepState, string> = {
  done: "bg-teal-100 text-teal-700",
  active: "bg-teal-600 text-white",
  todo: "bg-slate-100 text-slate-400",
  locked: "bg-slate-100 text-slate-400",
};

/**
 * Stepper indikator langkah (tanpa library tambahan).
 * - Bila `statuses` diberikan, dipakai langsung (done/active/todo/locked).
 * - Bila tidak, status diturunkan dari `currentIndex` (back-compat).
 */
export function Stepper({
  steps,
  currentIndex,
  statuses,
  className = "",
}: {
  steps: Step[];
  currentIndex: number;
  statuses?: StepState[];
  className?: string;
}) {
  const resolve = (i: number): StepState => {
    if (statuses && statuses[i]) return statuses[i];
    if (i < currentIndex) return "done";
    if (i === currentIndex) return "active";
    return "todo";
  };

  return (
    <ol className={"flex flex-wrap items-center gap-2 " + className}>
      {steps.map((s, i) => {
        const state = resolve(i);
        const badge = BADGE[state];
        return (
          <li key={s.id} className="flex items-center gap-2">
            <span
              className={
                "flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors " +
                CIRCLE[state]
              }
            >
              {state === "done" ? (
                <Check className="size-4" />
              ) : state === "locked" ? (
                <Lock className="size-3.5" />
              ) : (
                i + 1
              )}
            </span>
            <div className="flex flex-col leading-tight">
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
              <span
                className={
                  "mt-0.5 inline-block w-fit rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide " +
                  badge.cls
                }
              >
                {badge.text}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span className="mx-2 h-px w-6 bg-slate-200 sm:w-10" aria-hidden />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export default Stepper;
