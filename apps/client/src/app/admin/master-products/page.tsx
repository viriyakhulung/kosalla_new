"use client";

import { useEffect, useState } from "react";
import { Boxes, Plus, List, Trash2 } from "lucide-react";
import {
  getMasterProducts,
  createMasterProduct,
  updateMasterProduct,
  deleteMasterProduct,
} from "@/lib/inventory-items";
import { getTeamGroups, type TeamGroup } from "@/lib/organization-teams";
import { PageHead, SectionCard, Field, adminInput, adminPrimaryBtn, adminGhostBtn, RowIcon } from "@/components/admin/ui";

type MasterProduct = {
  id: number;
  name: string;
  product_type: string;
  is_active: boolean;
  team_group_id?: number | null;
  team_group?: { id: number; name: string } | null;
};

export default function MasterProductsPage() {
  const [masters, setMasters] = useState<MasterProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");

  // Team PIC (mapping produk → team)
  const [teams, setTeams] = useState<TeamGroup[]>([]);
  const [savingTeamId, setSavingTeamId] = useState<number | null>(null);

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

  async function loadTeams() {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("kosalla_token") : null;
      const list = await getTeamGroups(token);
      setTeams(list.filter((t) => t.is_active));
    } catch (e: any) {
      console.error("Gagal memuat team", e?.message);
    }
  }

  async function onChangeTeamPic(mp: MasterProduct, value: string) {
    const teamGroupId = value ? Number(value) : null;
    setSavingTeamId(mp.id);
    setError("");
    try {
      await updateMasterProduct(mp.id, { team_group_id: teamGroupId });
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Gagal set Team PIC");
    } finally {
      setSavingTeamId(null);
    }
  }

  useEffect(() => {
    load();
    loadTeams();
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

  if (loading) return <div className="py-10 text-center text-sm text-slate-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <PageHead
        icon={<Boxes className="size-5" />}
        title="Master Products"
        subtitle="Katalog produk global yang dapat dipakai setiap organisasi"
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Create */}
      <SectionCard icon={<Plus className="size-4" />} iconTone="amber" title="Tambah Master Product">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nama produk">
            <input
              className={adminInput}
              placeholder="Nama produk"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
        </div>
        <button onClick={onCreate} disabled={submitting || !name.trim()} className={`${adminPrimaryBtn} mt-4`}>
          <Plus className="size-4" />
          {submitting ? "Menyimpan..." : "Simpan"}
        </button>
      </SectionCard>

      {/* List */}
      <SectionCard icon={<List className="size-4" />} title="Daftar Master Product" subtitle={`${masters.length} produk`}>
        {masters.length === 0 ? (
          <div className="py-6 text-center text-sm text-slate-400">Belum ada master product.</div>
        ) : (
          <div className="space-y-2">
            {masters.map((mp) => (
              <div
                key={mp.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3"
              >
                <div className="flex items-center gap-3">
                  <RowIcon icon={<Boxes className="size-4" />} />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-900">{mp.name}</span>
                      <span
                        className={
                          mp.is_active
                            ? "rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600"
                            : "rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500"
                        }
                      >
                        {mp.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">Type: {mp.product_type}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-400">Team PIC:</span>
                    <select
                      className={`${adminInput} h-9 w-44`}
                      value={mp.team_group_id ?? ""}
                      disabled={savingTeamId === mp.id}
                      onChange={(e) => onChangeTeamPic(mp, e.target.value)}
                    >
                      <option value="">— belum diset —</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button className={adminGhostBtn} onClick={() => onToggle(mp)}>
                    {mp.is_active ? "Disable" : "Enable"}
                  </button>
                  <button
                    onClick={() => onDelete(mp.id)}
                    className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    aria-label="Delete"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
