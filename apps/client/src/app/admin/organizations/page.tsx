"use client";

import { useEffect, useState } from "react";
// Pastikan path import ini benar sesuai struktur folder kamu
import { getOrganizations, createOrganization, deleteOrganization, updateOrganization } from "../../../lib/organizations";

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
      <div>
        <h1 className="text-2xl font-bold">Organizations</h1>
        <p className="text-slate-600 text-sm">CRUD minimal: List / Create / Delete / Inline Edit</p>
      </div>

      {error && (
        <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Create Form */}
      <div className="bg-white border rounded p-4 space-y-3">
        <h2 className="font-semibold">Create Organization</h2>
        <div className="flex gap-2">
          <input
            className="border rounded px-3 py-2 w-full"
            placeholder="Organization name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button className="border rounded px-4 py-2 bg-blue-600 text-white hover:bg-blue-700" onClick={onCreate}>
            Create
          </button>
        </div>
      </div>

      {/* List */}
      <div className="bg-white border rounded p-4">
        <h2 className="font-semibold mb-3">List</h2>

        {loading ? (
          <div className="text-slate-600 text-sm">Loading...</div>
        ) : orgs.length === 0 ? (
          <div className="text-slate-600 text-sm">No organizations</div>
        ) : (
          <ul className="space-y-2">
            {orgs.map((org) => (
              <li key={org.id} className="flex items-center justify-between border rounded p-3">
                
                {/* 👇 LOGIKA TAMPILAN: JIKA SEDANG DIEDIT vs TIDAK 👇 */}
                
                {editingId === org.id ? (
                  // === TAMPILAN MODE EDIT (Kotak Input) ===
                  <div className="flex-1 flex gap-2 items-center">
                    <input 
                      className="border rounded px-2 py-1 w-full"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      autoFocus
                    />
                    <button 
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                      onClick={onUpdate}
                    >
                      Save
                    </button>
                    <button 
                      className="bg-gray-300 text-gray-800 px-3 py-1 rounded text-sm hover:bg-gray-400"
                      onClick={cancelEdit}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  // === TAMPILAN MODE BACA (Text Biasa) ===
                  <>
                    <div className="flex-1">
                      <div className="font-medium">{org.name}</div>
                      <div className="text-xs text-slate-500">ID: {org.id}</div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        className="border rounded px-3 py-1 hover:bg-gray-50"
                        onClick={() => startEdit(org)} // Panggil fungsi startEdit
                      >
                        Edit
                      </button>

                      <button 
                        className="border rounded px-3 py-1 hover:bg-red-50 text-red-600 border-red-200" 
                        onClick={() => onDelete(org.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
                
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}