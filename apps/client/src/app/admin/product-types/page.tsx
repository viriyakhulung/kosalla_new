"use client";

import { useEffect, useMemo, useState } from "react";
import { Package, Building2, PackagePlus, List, Trash2 } from "lucide-react";
import { getOrganizations } from "@/lib/organizations";
import {
  getInventoryItemsByOrg,
  createInventoryItem,
  deleteInventoryItem,
  getMasterProducts,
  type InventoryItem,
} from "@/lib/inventory-items";
import { PageHead, SectionCard, Field, adminInput, adminPrimaryBtn, RowIcon } from "@/components/admin/ui";

type Org = { id: number; name: string };
type MasterProduct = { id: number; name: string; product_type: string; is_active: boolean };

export default function ProductTypesPage() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [orgId, setOrgId] = useState<number | null>(null);

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [masters, setMasters] = useState<MasterProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [selectedMasterId, setSelectedMasterId] = useState<number | "">("");
  const [assignActive, setAssignActive] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError("");

    Promise.all([getOrganizations(), getMasterProducts()])
      .then(([orgRes, masterRes]: any) => {
        const orgRows = Array.isArray(orgRes) ? orgRes : orgRes;
        setOrgs(orgRows);
        if (orgRows?.length && !orgId) setOrgId(orgRows[0].id);

        setMasters(masterRes?.data ?? []);
      })
      .catch((e) => setError(e?.message ?? "Gagal load data"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedOrg = useMemo(() => orgs.find((o) => o.id === orgId) ?? null, [orgs, orgId]);

  async function reloadItems() {
    if (!orgId) return;
    setError("");
    const json = await getInventoryItemsByOrg(orgId);
    setItems(json.data ?? []);
  }

  useEffect(() => {
    if (!orgId) return;
    reloadItems().catch((e) => setError(e?.message ?? "Gagal load inventory items"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  async function onAssign() {
    if (!orgId) return;
    if (!selectedMasterId) return setError("Pilih master product terlebih dahulu");
    setSubmitting(true);
    setError("");

    try {
      await createInventoryItem(orgId, {
        master_product_id: Number(selectedMasterId),
        is_active: assignActive,
      });
      setSelectedMasterId("");
      setAssignActive(true);
      await reloadItems();
    } catch (e: any) {
      setError(e?.message ?? "Gagal assign product");
    } finally {
      setSubmitting(false);
    }
  }

  async function onDelete(id: number) {
    if (!confirm("Yakin delete item ini?")) return;
    setError("");
    try {
      await deleteInventoryItem(id);
      await reloadItems();
    } catch (e: any) {
      setError(e?.message ?? "Gagal delete");
    }
  }

  if (loading) return <div className="py-10 text-center text-sm text-slate-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <PageHead
        icon={<Package className="size-5" />}
        title="Inventory Items"
        subtitle="Assign master product ke organisasi"
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Select Organization */}
      <SectionCard icon={<Building2 className="size-4" />} title="Select Organization">
        {orgs.length === 0 ? (
          <div className="text-sm text-slate-400">
            No organizations. Buat organization dulu di menu Organizations.
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-4">
            <select
              className={`${adminInput} sm:max-w-xs`}
              value={orgId ?? ""}
              onChange={(e) => setOrgId(Number(e.target.value))}
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

      {/* Assign master product ke organisasi */}
      <SectionCard icon={<PackagePlus className="size-4" />} iconTone="amber" title="Assign Produk ke Organisasi">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Master product">
            <select
              className={adminInput}
              value={selectedMasterId}
              onChange={(e) => setSelectedMasterId(e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">— Pilih master product —</option>
              {masters
                .filter((m) => m.is_active)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Status">
            <label className="flex h-10 items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="size-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500/30"
                checked={assignActive}
                onChange={(e) => setAssignActive(e.target.checked)}
              />
              Active
            </label>
          </Field>
        </div>
        <button
          onClick={onAssign}
          disabled={submitting || !orgId || !selectedMasterId}
          className={`${adminPrimaryBtn} mt-4`}
        >
          <PackagePlus className="size-4" />
          {submitting ? "Assigning..." : "Assign Product"}
        </button>
      </SectionCard>

      {/* List */}
      <SectionCard
        icon={<List className="size-4" />}
        title="List"
        subtitle={orgId ? `${items.length} item` : undefined}
      >
        {items.length === 0 ? (
          <div className="py-6 text-center text-sm text-slate-400">No items for this organization</div>
        ) : (
          <div className="space-y-2">
            {items.map((it) => (
              <div
                key={it.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3"
              >
                <div className="flex items-center gap-3">
                  <RowIcon icon={<Package className="size-4" />} tone="amber" />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-900">{it.name}</span>
                      <span
                        className={
                          it.is_active
                            ? "rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600"
                            : "rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500"
                        }
                      >
                        {it.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">
                      ID: {it.id} · OrgID: {it.organization_id} · Type: {it.product_type}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onDelete(it.id)}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
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
