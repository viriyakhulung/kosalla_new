"use client";

import { useEffect, useMemo, useState } from "react";
import { getOrganizations } from "@/lib/organizations";
import { getLocations, createLocation, deleteLocation } from "@/lib/locations";

type Org = { id: number; name: string };
type Loc = { id: number; organization_id: number; name: string; address?: string | null };

export default function LocationsPage() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);

  const [locs, setLocs] = useState<Loc[]>([]);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const selectedOrg = useMemo(
    () => orgs.find((o) => o.id === selectedOrgId) ?? null,
    [orgs, selectedOrgId]
  );

  async function loadOrgs() {
    console.log("📡 [LOC PAGE] load orgs...");
    const list = await getOrganizations();
    setOrgs(list);
    if (!selectedOrgId && list.length > 0) setSelectedOrgId(list[0].id);
  }

  async function loadLocs(orgId: number) {
    console.log("📡 [LOC PAGE] load locs for org:", orgId);
    const list = await getLocations(orgId);
    setLocs(list);
  }

  async function loadAll() {
    try {
      setError("");
      setLoading(true);
      await loadOrgs();
    } catch (e: any) {
      console.error("❌ [LOC PAGE] load error", e);
      setError(e?.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // reload locations when org changes
  useEffect(() => {
    if (!selectedOrgId) return;
    loadLocs(selectedOrgId).catch((e: any) => {
      console.error("❌ [LOC PAGE] load locs error", e);
      setError(e?.message ?? "Failed to load locations");
    });
  }, [selectedOrgId]);

  async function onCreate() {
    try {
      setError("");
      if (!selectedOrgId) {
        setError("Pilih organization dulu");
        return;
      }
      if (!name.trim()) {
        setError("Location name wajib diisi");
        return;
      }

      console.log("➕ [LOC PAGE] create location", { selectedOrgId, name, address });

      await createLocation(selectedOrgId, {
        name: name.trim(),
        address: address.trim() ? address.trim() : null,
      });

      setName("");
      setAddress("");
      await loadLocs(selectedOrgId);
    } catch (e: any) {
      console.error("❌ [LOC PAGE] create error", e);
      setError(e?.message ?? "Failed to create location");
    }
  }

  async function onDelete(id: number) {
    const ok = confirm("Yakin delete location ini?");
    if (!ok) return;

    try {
      setError("");
      console.log("🗑️ [LOC PAGE] delete location", id);
      await deleteLocation(id);

      if (selectedOrgId) await loadLocs(selectedOrgId);
    } catch (e: any) {
      console.error("❌ [LOC PAGE] delete error", e);
      setError(e?.message ?? "Failed to delete location");
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Locations</h1>
        <p className="text-slate-600 text-sm">Nested by Organization</p>
      </div>

      {error && (
        <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Org selector */}
      <div className="bg-white border rounded p-4 space-y-2">
        <div className="font-semibold">Select Organization</div>

        {loading ? (
          <div className="text-slate-600 text-sm">Loading organizations...</div>
        ) : orgs.length === 0 ? (
          <div className="text-slate-600 text-sm">
            No organizations. Buat organization dulu di menu Organizations.
          </div>
        ) : (
          <select
            className="border rounded px-3 py-2"
            value={selectedOrgId ?? ""}
            onChange={(e) => setSelectedOrgId(Number(e.target.value))}
          >
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name} (ID: {o.id})
              </option>
            ))}
          </select>
        )}

        {selectedOrg && (
          <div className="text-xs text-slate-500">
            Selected: <span className="font-medium">{selectedOrg.name}</span>
          </div>
        )}
      </div>

      {/* Create */}
      <div className="bg-white border rounded p-4 space-y-3">
        <h2 className="font-semibold">Create Location</h2>

        <div className="grid gap-2">
          <input
            className="border rounded px-3 py-2"
            placeholder="Location name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="border rounded px-3 py-2"
            placeholder="Address (optional)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        <button className="border rounded px-4 py-2" onClick={onCreate}>
          Create
        </button>
      </div>

      {/* List */}
      <div className="bg-white border rounded p-4">
        <h2 className="font-semibold mb-3">List</h2>

        {!selectedOrgId ? (
          <div className="text-slate-600 text-sm">Select organization first</div>
        ) : locs.length === 0 ? (
          <div className="text-slate-600 text-sm">No locations for this organization</div>
        ) : (
          <ul className="space-y-2">
            {locs.map((loc) => (
              <li key={loc.id} className="flex items-center justify-between border rounded p-3">
                <div>
                  <div className="font-medium">{loc.name}</div>
                  <div className="text-xs text-slate-500">
                    ID: {loc.id} • OrgID: {loc.organization_id}
                    {loc.address ? ` • ${loc.address}` : ""}
                  </div>
                </div>

                <button className="border rounded px-3 py-1" onClick={() => onDelete(loc.id)}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
