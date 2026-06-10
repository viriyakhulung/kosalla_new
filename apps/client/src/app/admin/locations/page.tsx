"use client";

import { useEffect, useMemo, useState } from "react";
import { MapPin, Building2, Plus, Trash2, List } from "lucide-react";
import { getOrganizations } from "@/lib/organizations";
import { getLocations, createLocation, deleteLocation } from "@/lib/locations";
import { PageHead, StatCard, SectionCard, Field, adminInput, adminPrimaryBtn, RowIcon } from "@/components/admin/ui";

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
    <div className="space-y-6">
      <PageHead
        icon={<MapPin className="size-5" />}
        title="Locations"
        subtitle="Kelola lokasi operasional · dikelompokkan per organisasi"
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Org selector */}
      <SectionCard icon={<Building2 className="size-4" />} title="Select Organization">
        {loading ? (
          <div className="text-sm text-slate-400">Loading organizations...</div>
        ) : orgs.length === 0 ? (
          <div className="text-sm text-slate-400">
            No organizations. Buat organization dulu di menu Organizations.
          </div>
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
      <SectionCard icon={<MapPin className="size-4" />} iconTone="amber" title="Create Location">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Location name">
            <input
              className={adminInput}
              placeholder="Nama lokasi"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field label="Address (optional)">
            <input
              className={adminInput}
              placeholder="Alamat"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </Field>
        </div>
        <button className={`${adminPrimaryBtn} mt-4`} onClick={onCreate}>
          <MapPin className="size-4" /> Create Location
        </button>
      </SectionCard>

      {/* List */}
      <SectionCard
        icon={<List className="size-4" />}
        title="List"
        subtitle={selectedOrgId ? `${locs.length} lokasi` : undefined}
      >
        {!selectedOrgId ? (
          <div className="py-6 text-center text-sm text-slate-400">Select organization first</div>
        ) : locs.length === 0 ? (
          <div className="py-6 text-center text-sm text-slate-400">No locations for this organization</div>
        ) : (
          <div className="space-y-2">
            {locs.map((loc) => (
              <div
                key={loc.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3"
              >
                <div className="flex items-center gap-3">
                  <RowIcon icon={<MapPin className="size-4" />} tone="amber" />
                  <div>
                    <div className="font-semibold text-slate-900">{loc.name}</div>
                    <div className="text-xs text-slate-400">
                      {loc.address ? loc.address : `OrgID: ${loc.organization_id}`}
                    </div>
                  </div>
                </div>

                <button
                  className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                  onClick={() => onDelete(loc.id)}
                  aria-label="Delete"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
