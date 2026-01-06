"use client";

import { useEffect, useMemo, useState } from "react";
import { getOrganizations } from "@/lib/organizations";
import {
  getInventoryItemsByOrg,
  createInventoryItem,
  deleteInventoryItem,
  type InventoryItem,
} from "@/lib/inventory-items";

type Org = { id: number; name: string };

export default function ProductTypesPage() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [orgId, setOrgId] = useState<number | null>(null);

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // form
  const [name, setName] = useState("");
  const [productType, setProductType] = useState("hardware");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError("");

    getOrganizations()
      .then((list: any) => {
        // organizations.ts kamu return json.data
        const rows = Array.isArray(list) ? list : list;
        setOrgs(rows);

        if (rows?.length && !orgId) setOrgId(rows[0].id);
      })
      .catch((e) => setError(e?.message ?? "Gagal load organizations"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedOrg = useMemo(() => orgs.find((o) => o.id === orgId) ?? null, [orgs, orgId]);

  async function reload() {
    if (!orgId) return;
    setError("");
    const json = await getInventoryItemsByOrg(orgId);
    setItems(json.data ?? []);
  }

  useEffect(() => {
    if (!orgId) return;
    reload().catch((e) => setError(e?.message ?? "Gagal load inventory items"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  async function onCreate() {
    if (!orgId) return;
    setSubmitting(true);
    setError("");

    try {
      await createInventoryItem(orgId, {
        name,
        product_type: productType,
        is_active: isActive,
      });
      setName("");
      setProductType("hardware");
      setIsActive(true);
      await reload();
    } catch (e: any) {
      setError(e?.message ?? "Gagal create item");
    } finally {
      setSubmitting(false);
    }
  }

  async function onDelete(id: number) {
    if (!confirm("Yakin delete item ini?")) return;
    setError("");
    try {
      await deleteInventoryItem(id);
      await reload();
    } catch (e: any) {
      setError(e?.message ?? "Gagal delete");
    }
  }

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Inventory Items</h1>
        <p className="text-slate-600">Nested by Organization</p>
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

      {/* Create */}
      <div className="bg-white border rounded p-4">
        <h2 className="font-semibold mb-3">Create Inventory Item</h2>

        <div className="space-y-3">
          <input
            className="border rounded px-3 py-2 w-full"
            placeholder="Item name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <select
            className="border rounded px-3 py-2 w-full"
            value={productType}
            onChange={(e) => setProductType(e.target.value)}
          >
            <option value="hardware">hardware</option>
            <option value="software">software</option>
            <option value="license">license</option>
            <option value="service">service</option>
          </select>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Active
          </label>

          <button
            onClick={onCreate}
            disabled={submitting || !orgId || !name.trim()}
            className="border rounded px-4 py-2 hover:bg-slate-50 disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create"}
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
