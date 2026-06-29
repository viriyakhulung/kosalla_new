"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import RichTextEditor from "@/components/portal/RichTextEditor";

type Product = { id: number; name: string };
type AdminProductsResponse = Product[] | { data?: Product[] };

function parseProducts(json: AdminProductsResponse): Product[] {
  if (Array.isArray(json)) return json;
  return json?.data ?? [];
}

type CreateAnnouncementPayload = {
  title: string;
  body_html: string;
  scope: "global" | "product";
  product_id?: number;
  starts_at?: string; // YYYY-MM-DD
  ends_at?: string; // YYYY-MM-DD
};

export default function AdminCreateAnnouncementPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [productId, setProductId] = useState<number | "">("");
  const [title, setTitle] = useState("");
  const [bodyHtml, setBodyHtml] = useState("<p></p>");

  const [startsAt, setStartsAt] = useState<string>(""); // YYYY-MM-DD
  const [endsAt, setEndsAt] = useState<string>(""); // YYYY-MM-DD

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;

    async function init() {
      setLoadingProducts(true);
      try {
        const json = await apiFetch<AdminProductsResponse>("/admin/master-products");
        if (alive) setProducts(parseProducts(json));
      } finally {
        if (alive) setLoadingProducts(false);
      }
    }

    init();
    return () => {
      alive = false;
    };
  }, []);

  async function onSubmit() {
    setErr("");

    const t = title.trim();
    if (!t) return setErr("Title wajib diisi.");
    if (!bodyHtml || bodyHtml.trim() === "<p></p>") return setErr("Body wajib diisi.");

    if (startsAt && endsAt && endsAt < startsAt) {
      return setErr("Ends At tidak boleh lebih kecil dari Starts At.");
    }

    const payload: CreateAnnouncementPayload = {
      title: t,
      body_html: bodyHtml,
      scope: productId === "" ? "global" : "product",
      ...(productId === "" ? {} : { product_id: productId }),
      ...(startsAt ? { starts_at: startsAt } : {}),
      ...(endsAt ? { ends_at: endsAt } : {}),
    };

    setSaving(true);
    try {
      await apiFetch<{ id: number }>("/admin/announcements", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      router.push("/admin/announcements");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Gagal create announcement");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-6">
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Create Announcement</h1>
            <div className="text-sm text-slate-600">Publish langsung</div>
          </div>

          <button
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50"
            onClick={() => router.push("/admin/announcements")}
          >
            ← Back
          </button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          {err ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>
          ) : null}

          <div className="grid gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700">Target Product</label>
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                value={productId === "" ? "" : String(productId)}
                onChange={(e) => setProductId(e.target.value ? Number(e.target.value) : "")}
                disabled={loadingProducts}
              >
                <option value="">(Global / All Products)</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Title</label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Maintenance Notice"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-slate-700">Starts At (optional)</label>
                <input
                  type="date"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Ends At (optional)</label>
                <input
                  type="date"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                />
              </div>
            </div>

            <div className="text-xs text-slate-500">
              Catatan: waktu akan otomatis jadi <b>00:00</b> untuk starts_at dan <b>23:59</b> untuk ends_at (di backend).
              Kalau starts_at diisi tapi ends_at kosong, ends_at otomatis <b>+7 hari</b>.
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Body (HTML)</label>
              <div className="mt-1 rounded-lg border border-slate-300 bg-white p-2">
                <RichTextEditor value={bodyHtml} onChange={setBodyHtml} />
              </div>
              <div className="mt-2 text-xs text-slate-500">Tip: HTML akan dirender di popup/portal.</div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                onClick={onSubmit}
                disabled={saving}
              >
                {saving ? "Saving..." : "Publish"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}