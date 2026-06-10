"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getOrganizations } from "@/lib/organizations";
import {
  getInventoryItemsByOrg,
  createInventoryItem,
  deleteInventoryItem,
  getMasterProducts,
  type InventoryItem,
} from "@/lib/inventory-items";

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

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventory Items</h1>
          <p className="text-slate-600">Assign master product ke organisasi.</p>
        </div>
      </div>

      {error ? (
        <div className="border border-red-200 bg-red-50 text-red-700 p-3 rounded">
          {error}
        </div>
      ) : null}

      {/* Select Organization */}
      <div className="bg-white border rounded p-4">
        <h2 className="font-semibold mb-2">Select Organization</h2>
        <select
          className="border rounded px-3 py-2 w-full"
          value={orgId ?? ""}
          onChange={(e) => setOrgId(Number(e.target.value))}
        >
          {orgs.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name} (ID: {o.id})
            </option>
          ))}
        </select>
        <p className="text-sm text-slate-600 mt-2">
          Selected: <b>{selectedOrg?.name ?? "-"}</b>
        </p>
      </div>

      {/* Assign master product ke organisasi */}
      <div className="bg-white border rounded p-4">
        <h2 className="font-semibold mb-3">Assign Produk ke Organisasi</h2>

        <div className="space-y-3">
          <select
            className="border rounded px-3 py-2 w-full"
            value={selectedMasterId}
            onChange={(e) => setSelectedMasterId(e.target.value ? Number(e.target.value) : "")}
          >
            <option value="">--- Pilih master product ---</option>
            {masters
              .filter((m) => m.is_active)
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
          </select>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={assignActive}
              onChange={(e) => setAssignActive(e.target.checked)}
            />
            Active
          </label>

          <button
            onClick={onAssign}
            disabled={submitting || !orgId || !selectedMasterId}
            className="border rounded px-4 py-2 hover:bg-slate-50 disabled:opacity-50"
          >
            {submitting ? "Assigning..." : "Assign Product"}
          </button>
        </div>
      </div>

      {/* List */}
      <div className="bg-white border rounded p-4">
        <h2 className="font-semibold mb-3">List</h2>

        {items.length === 0 ? (
          <p className="text-slate-600 text-sm">No items for this organization</p>
        ) : (
          <div className="space-y-2">
            {items.map((it) => (
              <div key={it.id} className="border rounded p-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold">{it.name}</div>
                  <div className="text-sm text-slate-600">
                    ID: {it.id} • OrgID: {it.organization_id} • Type: {it.product_type} • Active:{" "}
                    {it.is_active ? "yes" : "no"}
                  </div>
                </div>
                <button
                  onClick={() => onDelete(it.id)}
                  className="border rounded px-3 py-2 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
