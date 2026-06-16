"use client";

import { useEffect, useState } from "react";
import { Building2, Plus, Pencil, Trash2, Check, X, List } from "lucide-react";
// Pastikan path import ini benar sesuai struktur folder kamu
import { getOrganizations, createOrganization, deleteOrganization, updateOrganization } from "../../../lib/organizations";
import { PageHead, StatCard, SectionCard, Field, adminInput, adminPrimaryBtn, adminGhostBtn, RowIcon } from "@/components/admin/ui";

type Org = { id: number; name: string };

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // State untuk Inline Edit
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");

  async function load() {
    try {
      setError("");
      setLoading(true);

      console.log("📡 [ORG] load organizations...");
      const list = await getOrganizations();

      console.log("✅ [ORG] loaded:", list);
      setOrgs(list);
    } catch (e: any) {
      console.error("❌ [ORG] load error:", e);
      setError(e?.message ?? "Failed to load organizations");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate() {
    try {
      setError("");
      if (!name.trim()) {
        setError("Name wajib diisi");
        return;
      }

      console.log("➕ [ORG] create:", name);
      await createOrganization({ name: name.trim() });

      setName("");
      await load();
    } catch (e: any) {
      console.error("❌ [ORG] create error:", e);
      setError(e?.message ?? "Failed to create organization");
    }
  }

  async function onDelete(id: number) {
    const ok = confirm("Yakin delete organization ini?");
    if (!ok) return;

    try {
      setError("");
      console.log("🗑️ [ORG] delete:", id);
      await deleteOrganization(id);

      await load();
    } catch (e: any) {
      console.error("❌ [ORG] delete error:", e);
      setError(e?.message ?? "Failed to delete organization");
    }
  }

  // 👇👇 FUNCTION BARU UNTUK INLINE EDIT 👇👇
  
  function startEdit(org: Org) {
    setEditingId(org.id);
    setEditingName(org.name);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingName("");
  }

  async function onUpdate() {
    if (!editingId) return;

    try {
      setError("");
      console.log("✏️ [ORG] updating ID:", editingId, "New Name:", editingName);
      
      await updateOrganization(editingId, { name: editingName.trim() });
      
      // Reset state setelah sukses
      setEditingId(null);
      setEditingName("");
      
      // Reload data
      await load();
    } catch (e: any) {
      console.error("❌ [ORG] update error:", e);
      setError(e?.message ?? "Failed to update organization");
    }
  }
  // 👆👆 --------------------------------- 👆👆

  return (
    <div className="space-y-6">
      <PageHead
        icon={<Building2 className="size-5" />}
        title="Organizations"
        subtitle="Setup dan kelola organisasi · List / Create / Edit / Delete"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={<Building2 className="size-5" />} tone="teal" value={orgs.length} label="Total organizations" />
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Create Form */}
      <SectionCard icon={<Plus className="size-4" />} title="Create Organization">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Field label="Nama organisasi">
              <input
                className={adminInput}
                placeholder="Organization name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
          </div>
          <button className={adminPrimaryBtn} onClick={onCreate}>
            <Plus className="size-4" /> Create
          </button>
        </div>
      </SectionCard>

      {/* List org */}
      <SectionCard
        icon={<List className="size-4" />}
        title="List"
        subtitle={`${orgs.length} organisasi`}
      >
        {loading ? (
          <div className="py-6 text-center text-sm text-slate-400">Loading...</div>
        ) : orgs.length === 0 ? (
          <div className="py-6 text-center text-sm text-slate-400">No organizations</div>
        ) : (
          <div className="space-y-2">
            {orgs.map((org) => (
              <div
                key={org.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3"
              >
                {editingId === org.id ? (
                  <div className="flex flex-1 items-center gap-2">
                    <input
                      className={adminInput}
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      autoFocus
                    />
                    <button className={adminPrimaryBtn} onClick={onUpdate}>
                      <Check className="size-4" /> Save
                    </button>
                    <button className={adminGhostBtn} onClick={cancelEdit}>
                      <X className="size-4" /> Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <RowIcon icon={<Building2 className="size-4" />} />
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-slate-900">{org.name}</div>
                        <div className="text-xs text-slate-400">ID: {org.id}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button className={adminGhostBtn} onClick={() => startEdit(org)}>
                        <Pencil className="size-3.5" /> Edit
                      </button>
                      <button
                        className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        onClick={() => onDelete(org.id)}
                        aria-label="Delete"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
