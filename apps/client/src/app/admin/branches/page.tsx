"use client";

import { useEffect, useMemo, useState } from "react";
import { GitBranch, Building2, Plus, Pencil, Trash2, Check, X, List, MapPin } from "lucide-react";
import { getOrganizations } from "@/lib/organizations";
import {
  listBranches,
  createBranch,
  updateBranch,
  deleteBranch,
  type Branch,
  type BranchStatus,
} from "@/lib/branches";
import { PageHead, StatCard, SectionCard, Field, adminInput, adminPrimaryBtn, adminGhostBtn, RowIcon } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

type Org = { id: number; name: string };

export default function BranchesPage() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);

  const [branches, setBranches] = useState<Branch[]>([]);

  // Create form
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState<BranchStatus>("active");

  // Inline edit
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editStatus, setEditStatus] = useState<BranchStatus>("active");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const selectedOrg = useMemo(
    () => orgs.find((o) => o.id === selectedOrgId) ?? null,
    [orgs, selectedOrgId]
  );

  async function loadOrgs() {
    const list = await getOrganizations();
    setOrgs(list);
    if (!selectedOrgId && list.length > 0) setSelectedOrgId(list[0].id);
  }

  async function loadBranches(orgId: number) {
    const list = await listBranches(orgId);
    setBranches(list);
  }

  async function loadAll() {
    try {
      setError("");
      setLoading(true);
      await loadOrgs();
    } catch (e: any) {
      setError(e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedOrgId) return;
    loadBranches(selectedOrgId).catch((e: any) => setError(e?.message ?? "Failed to load branches"));
  }, [selectedOrgId]);

  async function onCreate() {
    try {
      setError("");
      if (!selectedOrgId) return setError("Pilih organization dulu");
      if (!name.trim()) return setError("Nama cabang wajib diisi");

      await createBranch(selectedOrgId, {
        name: name.trim(),
        code: code.trim() || null,
        address: address.trim() || null,
        status,
      });

      setName("");
      setCode("");
      setAddress("");
      setStatus("active");
      await loadBranches(selectedOrgId);
    } catch (e: any) {
      setError(e?.message ?? "Failed to create branch");
    }
  }

  function startEdit(b: Branch) {
    setEditingId(b.id);
    setEditName(b.name);
    setEditCode(b.code ?? "");
    setEditAddress(b.address ?? "");
    setEditStatus(b.status);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function onUpdate(id: number) {
    try {
      setError("");
      if (!editName.trim()) return setError("Nama cabang wajib diisi");

      await updateBranch(id, {
        name: editName.trim(),
        code: editCode.trim() || null,
        address: editAddress.trim() || null,
        status: editStatus,
      });
      setEditingId(null);
      if (selectedOrgId) await loadBranches(selectedOrgId);
    } catch (e: any) {
      setError(e?.message ?? "Failed to update branch");
    }
  }

  async function onDelete(id: number) {
    if (!confirm("Hapus permanen cabang ini? Tindakan ini tidak bisa dibatalkan. Lokasi yang menunjuk cabang ini akan dilepas (branch → kosong).")) return;
    try {
      setError("");
      await deleteBranch(id);
      if (selectedOrgId) await loadBranches(selectedOrgId);
    } catch (e: any) {
      setError(e?.message ?? "Failed to delete branch");
    }
  }

  return (
    <div className="space-y-6">
      <PageHead
        icon={<GitBranch className="size-5" />}
        title="Branches"
        subtitle="Kelola cabang (sub-unit) per organisasi · cabang menaungi lokasi"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={<GitBranch className="size-5" />} tone="teal" value={branches.length} label="Cabang di org terpilih" />
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Org selector */}
      <SectionCard icon={<Building2 className="size-4" />} title="Select Organization">
        {loading ? (
          <div className="text-sm text-slate-400">Loading organizations...</div>
        ) : orgs.length === 0 ? (
          <div className="text-sm text-slate-400">No organizations. Buat dulu di menu Organizations.</div>
        ) : (
          <div className="flex flex-wrap items-center gap-4">
            <select
              className={`${adminInput} sm:max-w-xs`}
              value={selectedOrgId ?? ""}
              onChange={(e) => setSelectedOrgId(Number(e.target.value))}
            >
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} (ID: {o.id})
                </option>
              ))}
            </select>
            {selectedOrg && (
              <p className="text-sm text-slate-500">
                Terpilih: <span className="font-semibold text-teal-700">{selectedOrg.name}</span>
              </p>
            )}
          </div>
        )}
      </SectionCard>

      {/* Create */}
      <SectionCard icon={<Plus className="size-4" />} title="Create Branch">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nama cabang" required>
            <input className={adminInput} placeholder="mis. Cabang Surabaya" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Kode (opsional)">
            <input className={adminInput} placeholder="mis. SBY" value={code} onChange={(e) => setCode(e.target.value)} />
          </Field>
          <Field label="Alamat (opsional)">
            <input className={adminInput} placeholder="Alamat" value={address} onChange={(e) => setAddress(e.target.value)} />
          </Field>
          <Field label="Status">
            <select className={adminInput} value={status} onChange={(e) => setStatus(e.target.value as BranchStatus)}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Field>
        </div>
        <button className={`${adminPrimaryBtn} mt-4`} onClick={onCreate}>
          <Plus className="size-4" /> Create Branch
        </button>
      </SectionCard>

      {/* List */}
      <SectionCard
        icon={<List className="size-4" />}
        title="List"
        subtitle={selectedOrgId ? `${branches.length} cabang` : undefined}
      >
        {!selectedOrgId ? (
          <div className="py-6 text-center text-sm text-slate-400">Select organization first</div>
        ) : branches.length === 0 ? (
          <div className="py-6 text-center text-sm text-slate-400">No branches for this organization</div>
        ) : (
          <div className="space-y-2">
            {branches.map((b) => (
              <div key={b.id} className="rounded-xl border border-slate-200 p-3">
                {editingId === b.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <input className={adminInput} placeholder="Nama" value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus />
                      <input className={adminInput} placeholder="Kode" value={editCode} onChange={(e) => setEditCode(e.target.value)} />
                      <input className={adminInput} placeholder="Alamat" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} />
                      <select className={adminInput} value={editStatus} onChange={(e) => setEditStatus(e.target.value as BranchStatus)}>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className={adminPrimaryBtn} onClick={() => onUpdate(b.id)}>
                        <Check className="size-4" /> Save
                      </button>
                      <button className={adminGhostBtn} onClick={cancelEdit}>
                        <X className="size-4" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <RowIcon icon={<GitBranch className="size-4" />} />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-slate-900">{b.name}</span>
                          {b.code && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">{b.code}</span>}
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                              b.status === "active" ? "bg-green-100 text-green-700" : "bg-rose-50 text-rose-600"
                            )}
                          >
                            {b.status}
                          </span>
                        </div>
                        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-400">
                          <MapPin className="size-3" /> {b.locations_count ?? 0} lokasi
                          {b.address ? ` · ${b.address}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className={adminGhostBtn} onClick={() => startEdit(b)}>
                        <Pencil className="size-3.5" /> Edit
                      </button>
                      <button
                        className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        onClick={() => onDelete(b.id)}
                        aria-label="Delete"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
