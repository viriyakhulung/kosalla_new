"use client";

import React, { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type PopupItem =
  | {
      type: "announcement";
      id: number;
      title: string;
      body_html: string;
      scope: "global" | "product";
      product_id?: number | null;
      published_at?: string | null;
      starts_at?: string | null;
      ends_at?: string | null;
    }
  | {
      type: "contract_alert";
      contract_id: number;
      contract_number: string;
      end_date: string;
      days_left: number;
      alert_type: "D90" | "D30";
    };

type PendingRes = {
  contract?: {
    active: boolean;
    contract_id?: number;
    contract_number?: string;
    end_date?: string;
    message?: string;
    skipped?: boolean;
  };
  items: PopupItem[];
};

export default function PortalPopupsClient({ enabled = true }: { enabled?: boolean }) {
  const [items, setItems] = useState<PopupItem[]>([]);
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await apiFetch<PendingRes>("/portal/popups/pending");
      const list = res?.items ?? [];
      setItems(list);
      setIdx(0);
      setOpen(list.length > 0);
    } catch {
      setItems([]);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // ✅ Gate FE: kalau bukan customer, jangan fetch & jangan tampilkan popup
    if (!enabled) {
      setItems([]);
      setOpen(false);
      setIdx(0);
      setLoading(false);
      return;
    }

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // kalau disabled, jangan render apa-apa
  if (!enabled) return null;

  const current = items[idx];
  if (loading) return null;
  if (!open || !current) return null;

  async function onOk() {
    // ✅ Requirement: announcement muncul lagi setiap login selama window
    // Jadi: announcement TIDAK disimpan dismissed ke DB.
    try {
      if (current.type === "contract_alert") {
        const form = new URLSearchParams();
        form.set("alert_type", current.alert_type);
        await apiFetch(`/portal/contracts/${current.contract_id}/dismiss`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: form.toString(),
        });
      }
    } catch {
      // ignore
    }

    const next = idx + 1;
    if (next < items.length) setIdx(next);
    else setOpen(false);
  }

  const title =
    current.type === "announcement"
      ? current.title
      : `Kontrak akan habis (${current.alert_type})`;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
          <div className="text-base font-bold text-slate-900">{title}</div>
        </div>

        <div className="px-5 py-4">
          {current.type === "announcement" ? (
            <div
              className="kb-content text-slate-800 text-sm"
              dangerouslySetInnerHTML={{ __html: current.body_html ?? "" }}
            />
          ) : (
            <div className="text-sm text-slate-800 space-y-2">
              <div>
                Kontrak <b>{current.contract_number}</b> akan berakhir pada{" "}
                <b>{new Date(current.end_date).toLocaleDateString()}</b>.
              </div>
              <div>
                Sisa hari: <b>{current.days_left}</b>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-slate-200 flex justify-end gap-2 bg-white">
          <button
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            onClick={onOk}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}