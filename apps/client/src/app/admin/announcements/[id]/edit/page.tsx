"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import RichTextEditor from "@/components/portal/RichTextEditor";

type Product = { id: number; name: string };
type AdminProductsResponse = Product[] | { data?: Product[] };

type Announcement = {
  id: number;
  scope: "global" | "product";
  product_id: number | null;
  title: string;
  body_html: string;
  starts_at: string | null;
  ends_at: string | null;
  published_at: string | null;
};

function parseProducts(json: AdminProductsResponse): Product[] {
  if (Array.isArray(json)) return json;
  return json?.data ?? [];
}

function toDatetimeLocal(v: string | null) {
  if (!v) return "";
  const d = new Date(v);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminEditAnnouncementPage() {
  const router = useRouter();
  const params = useParams();
  const id = String((params as any).id);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const [productId, setProductId] = useState<number | "">("");
  const [title, setTitle] = useState("");
  const [bodyHtml, setBodyHtml] = useState("<p></p>");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  async function loadAll() {
    setLoading(true);
    setErr("");
    try {
      const [prodJson, annJson] = await Promise.all([
        apiFetch<AdminProductsResponse>("/admin/master-products"),
        apiFetch<Announcement>(`/admin/announcements/${id}`),
      ]);

      setProducts(parseProducts(prodJson));

      setTitle(annJson.title || "");
      setBodyHtml(annJson.body_html || "<p></p>");
      setProductId(annJson.scope === "global" ? "" : (annJson.product_id ?? ""));
      setStartsAt(toDatetimeLocal(annJson.starts_at));
      setEndsAt(toDatetimeLocal(annJson.ends_at));
    } catch (e: any) {
      setErr(e?.message || "Gagal load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function onSave() {
    setErr("");
    if (!title.trim()) return setErr("Title wajib diisi.");
    if (!bodyHtml || bodyHtml.trim() === "<p></p>") return setErr("Body wajib diisi.");

    const payload: any = {
      title: title.trim(),
      body_html: bodyHtml,
    };

    if (productId === "") {
      payload.scope = "global";
    } else {
      payload.scope = "product";
      payload.product_id = productId;
    }

    payload.starts_at = startsAt || null;
    payload.ends_at = endsAt || null;

    setSaving(true);
    try {
      await apiFetch(`/admin/announcements/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      router.push("/admin/announcements");
    } catch (e: any) {
      setErr(e?.message || "Gagal save");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!confirm("Hapus announcement ini?")) return;
    try {
      await apiFetch(`/admin/announcements/${id}`, { method: "DELETE" });
      router.push("/admin/announcements");
    } catch (e: any) {
      alert(e?.message || "Gagal delete");
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-6">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Edit Announcement</h1>
            <div className="text-sm text-slate-600">ID: {id}</div>
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

          {loading ? (
            <div className="text-sm text-slate-500">Loading...</div>
          ) : (
            <div className="grid gap-3">
              <div>
                <label className="text-sm font-medium text-slate-700">Target Product</label>
                <select
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                  value={productId === "" ? "" : String(productId)}
                  onChange={(e) => setProductId(e.target.value ? Number(e.target.value) : "")}
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
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-slate-700">Starts At (optional)</label>
                  <input
                    type="datetime-local"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Ends At (optional)</label>
                  <input
                    type="datetime-local"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Body (HTML)</label>
                <div className="mt-1 rounded-lg border border-slate-300 bg-white p-2">
                  <RichTextEditor value={bodyHtml} onChange={setBodyHtml} />
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                  onClick={onDelete}
                >
                  Delete
                </button>

                <button
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                  onClick={onSave}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold text-slate-600 mb-2">Preview (render HTML)</div>
                <div className="kb-content" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}