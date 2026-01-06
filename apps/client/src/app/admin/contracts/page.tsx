"use client";

import { useEffect, useMemo, useState } from "react";
import { getOrganizations } from "@/lib/organizations";
import { createContract, deleteContract, getContracts } from "@/lib/contracts";

type Org = { id: number; name: string };
type ContractRow = {
  id: number;
  organization_id: number;
  contract_number: string;
  start_date: string;
  end_date: string;
  status: string;
  reminder_days_before_end: number;
  notes?: string | null;
  organization?: Org;
};

export default function ContractsPage() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // form
  const [organizationId, setOrganizationId] = useState<number | "">("");
  const [contractNumber, setContractNumber] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState<"active" | "expired" | "terminated">("active");
  const [reminderDays, setReminderDays] = useState<number>(90);
  const [notes, setNotes] = useState("");

  const selectedOrg = useMemo(
    () => orgs.find((o) => o.id === organizationId) ?? null,
    [orgs, organizationId]
  );

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const [orgList, contractPage] = await Promise.all([
        getOrganizations(),
        getContracts(),
      ]);

      setOrgs(orgList);

      // contractPage = paginator (data, links, meta)
      setContracts(contractPage.data ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "Gagal load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setErr("");

    if (!organizationId) return setErr("Pilih organization dulu.");
    if (!contractNumber.trim()) return setErr("Contract number wajib diisi.");
    if (!startDate) return setErr("Start date wajib diisi.");
    if (!endDate) return setErr("End date wajib diisi.");

    try {
      await createContract({
        organization_id: Number(organizationId),
        contract_number: contractNumber.trim(),
        start_date: startDate,
        end_date: endDate,
        status,
        reminder_days_before_end: reminderDays,
        notes: notes.trim() ? notes.trim() : null,
      });

      // reset form
      setContractNumber("");
      setStartDate("");
      setEndDate("");
      setStatus("active");
      setReminderDays(90);
      setNotes("");

      await load();
    } catch (e: any) {
      setErr(e?.message ?? "Gagal create contract");
    }
  }

  async function onDelete(id: number) {
    if (!confirm("Yakin mau delete contract ini?")) return;
    setErr("");
    try {
      await deleteContract(id);
      await load();
    } catch (e: any) {
      setErr(e?.message ?? "Gagal delete contract");
    }
  }

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Contracts</h1>
        <p className="text-slate-600">CRUD minimal: List / Create / Delete</p>
      </div>

      {err ? (
        <div className="border border-red-200 bg-red-50 text-red-700 p-3 rounded">
          {err}
        </div>
      ) : null}

      {/* Create */}
      <div className="bg-white border rounded p-4 space-y-3">
        <h2 className="font-semibold">Create Contract</h2>

        <form className="space-y-3" onSubmit={onCreate}>
          <div>
            <label className="text-sm text-slate-600">Organization</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={organizationId}
              onChange={(e) => setOrganizationId(e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">-- pilih organization --</option>
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} (ID: {o.id})
                </option>
              ))}
            </select>

            {selectedOrg ? (
              <p className="text-xs text-slate-500 mt-1">
                Selected: {selectedOrg.name}
              </p>
            ) : null}
          </div>

          <div>
            <label className="text-sm text-slate-600">Contract Number</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={contractNumber}
              onChange={(e) => setContractNumber(e.target.value)}
              placeholder="CN-2025-001"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-slate-600">Start Date</label>
              <input
                type="date"
                className="w-full border rounded px-3 py-2"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm text-slate-600">End Date</label>
              <input
                type="date"
                className="w-full border rounded px-3 py-2"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-slate-600">Status</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
              >
                <option value="active">active</option>
                <option value="expired">expired</option>
                <option value="terminated">terminated</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-slate-600">Reminder Days</label>
              <input
                type="number"
                className="w-full border rounded px-3 py-2"
                value={reminderDays}
                onChange={(e) => setReminderDays(Number(e.target.value))}
                min={0}
                max={3650}
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-600">Notes (optional)</label>
            <textarea
              className="w-full border rounded px-3 py-2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Catatan kontrak..."
            />
          </div>

          <button className="px-4 py-2 rounded border bg-white hover:bg-slate-50">
            Create
          </button>
        </form>
      </div>

      {/* List */}
      <div className="bg-white border rounded p-4 space-y-3">
        <h2 className="font-semibold">List</h2>

        {contracts.length === 0 ? (
          <p className="text-slate-600">No contracts</p>
        ) : (
          <div className="space-y-2">
            {contracts.map((c) => (
              <div
                key={c.id}
                className="border rounded p-3 flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold">{c.contract_number}</div>
                  <div className="text-xs text-slate-600">
                    ID: {c.id} • OrgID: {c.organization_id}{" "}
                    • {c.start_date} → {c.end_date} • {c.status}
                  </div>
                </div>

                <button
                  onClick={() => onDelete(c.id)}
                  className="px-3 py-1 rounded border text-red-600 hover:bg-red-50"
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
