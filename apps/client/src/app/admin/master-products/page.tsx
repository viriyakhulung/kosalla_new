"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getMasterProducts,
  createMasterProduct,
  updateMasterProduct,
  deleteMasterProduct,
} from "@/lib/inventory-items";

type MasterProduct = { id: number; name: string; product_type: string; is_active: boolean };

export default function MasterProductsPage() {
  const [masters, setMasters] = useState<MasterProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");

  async function load() {
    setError("");
    setLoading(true);
    try {
      const res = await getMasterProducts();
      setMasters(res?.data ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Gagal memuat master product");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate() {
    setSubmitting(true);
    setError("");
    try {
      await createMasterProduct({ name, product_type: "software", is_active: true });
      setName("");
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Gagal membuat master product");
    } finally {
      setSubmitting(false);
    }
  }

  async function onToggle(mp: MasterProduct) {
    try {
      await updateMasterProduct(mp.id, { is_active: !mp.is_active });
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Gagal update status");
    }
  }

  async function onDelete(id: number) {
    if (!confirm("Yakin hapus master product ini?")) return;
    try {
      await deleteMasterProduct(id);
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Gagal hapus");
    }
  }

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Master Products</h1>
          <p className="text-slate-600">Katalog produk global yang dapat dipakai setiap organisasi.</p>
        </div>
      </div>

      {error && (
        <div className="border border-red-200 bg-red-50 text-red-700 p-3 rounded">{error}</div>
      )}

      <div className="bg-white border rounded p-4">
        <h2 className="font-semibold mb-3">Tambah Master Product</h2>
        <div className="space-y-3 max-w-md">
          <input
            className="border rounded px-3 py-2 w-full"
            placeholder="Nama produk"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button
            onClick={onCreate}
            disabled={submitting || !name.trim()}
            className="border rounded px-4 py-2 hover:bg-slate-50 disabled:opacity-50"
          >
            {submitting ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>

      <div className="bg-white border rounded p-4">
        <h2 className="font-semibold mb-3">Daftar Master Product</h2>
        {masters.length === 0 ? (
          <p className="text-slate-600 text-sm">Belum ada master product.</p>
        ) : (
          <div className="space-y-2">
            {masters.map((mp) => (
              <div key={mp.id} className="border rounded p-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold">{mp.name}</div>
                  <div className="text-xs text-slate-600">
                    Type: {mp.product_type} • Active: {mp.is_active ? "yes" : "no"}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="text-sm border rounded px-2 py-1 hover:bg-slate-50"
                    onClick={() => onToggle(mp)}
                  >
                    {mp.is_active ? "Disable" : "Enable"}
                  </button>
                  <button
                    className="text-sm border rounded px-2 py-1 hover:bg-red-50"
                    onClick={() => onDelete(mp.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
