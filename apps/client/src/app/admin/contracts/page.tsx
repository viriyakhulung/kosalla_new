"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, Plus, List, Pencil, Trash2, Check, X, CircleCheck, Clock } from "lucide-react";
import { getOrganizations } from "@/lib/organizations";
import {
  createContract,
  deleteContract,
  getContracts,
  updateContract,
} from "@/lib/contracts";
import { PageHead, StatCard, SectionCard, Field, adminInput, adminPrimaryBtn, adminGhostBtn } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

function contractStatusBadge(s: string): string {
  const v = String(s).toLowerCase();
  if (v === "active") return "bg-green-50 text-green-700 border border-green-200";
  if (v === "expired") return "bg-rose-50 text-rose-600 border border-rose-200";
  if (v === "terminated") return "bg-slate-100 text-slate-600 border border-slate-200";
  return "bg-amber-50 text-amber-700 border border-amber-200";
}

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

function fmtDateHuman(iso?: string) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

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

  // edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContractNumber, setEditContractNumber] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editStatus, setEditStatus] = useState<"active" | "expired" | "terminated">("active");
  const [editReminderDays, setEditReminderDays] = useState<number>(90);
  const [editNotes, setEditNotes] = useState("");

  const selectedOrg = useMemo(
    () => orgs.find((o) => o.id === organizationId) ?? null,
    [orgs, organizationId]
  );
  const orgMap = useMemo(() => {
    const m = new Map<number, string>();
    orgs.forEach((o) => m.set(o.id, o.name));
    return m;
  }, [orgs]);

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const [orgList, contractPage] = await Promise.all([getOrganizations(), getContracts()]);
      setOrgs(orgList);
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

  function openEdit(c: ContractRow) {
    setEditingId(c.id);
    setEditContractNumber(c.contract_number);
    setEditStartDate(c.start_date ? c.start_date.slice(0, 10) : "");
    setEditEndDate(c.end_date ? c.end_date.slice(0, 10) : "");
    setEditStatus(c.status as any);
    setEditReminderDays(c.reminder_days_before_end);
    setEditNotes(c.notes ?? "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditContractNumber("");
    setEditStartDate("");
    setEditEndDate("");
    setEditStatus("active");
    setEditReminderDays(90);
    setEditNotes("");
  }

  async function onUpdate() {
    if (!editingId) return;
    setErr("");
    try {
      await updateContract(editingId, {
        contract_number: editContractNumber.trim(),
        start_date: editStartDate,
        end_date: editEndDate,
        status: editStatus,
        reminder_days_before_end: editReminderDays,
        notes: editNotes.trim() ? editNotes.trim() : null,
      });
      cancelEdit();
      await load();
    } catch (e: any) {
      setErr(e?.message ?? "Gagal update contract");
    }
  }

  function computedStatus(c: ContractRow) {
    // jika sudah lewat end_date dan status masih active, tampilkan expired
    const end = c.end_date ? new Date(c.end_date).getTime() : null;
    const now = Date.now();
    if (end && end < now && c.status === "active") return "expired";
    return c.status;
  }

  if (loading) return <div className="py-10 text-center text-sm text-slate-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <PageHead
        icon={<FileText className="size-5" />}
        title="Contracts"
        subtitle="Kelola kontrak & perjanjian"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={<FileText className="size-5" />} tone="teal" value={contracts.length} label="Total contracts" />
        <StatCard
          icon={<CircleCheck className="size-5" />}
          tone="emerald"
          value={contracts.filter((c) => computedStatus(c) === "active").length}
          label="Active / OK"
        />
        <StatCard
          icon={<Clock className="size-5" />}
          tone="sky"
          value={contracts.filter((c) => computedStatus(c) !== "active").length}
          label="Expired / other"
        />
      </div>

      {err ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{err}</div>
      ) : null}

      {/* Create */}
      <SectionCard icon={<Plus className="size-4" />} title="Create Contract">
        <form className="space-y-4" onSubmit={onCreate}>
          <Field label="Organization">
            <select
              className={adminInput}
              value={organizationId}
              onChange={(e) => setOrganizationId(e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">— pilih organization —</option>
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} (ID: {o.id})
                </option>
              ))}
            </select>
            {selectedOrg ? <p className="mt-1 text-xs text-slate-500">Selected: {selectedOrg.name}</p> : null}
          </Field>

          <Field label="Contract Number">
            <input
              className={adminInput}
              value={contractNumber}
              onChange={(e) => setContractNumber(e.target.value)}
              placeholder="CN-2025-001"
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Start Date">
              <input type="date" className={adminInput} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </Field>
            <Field label="End Date">
              <input type="date" className={adminInput} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Status">
              <select className={adminInput} value={status} onChange={(e) => setStatus(e.target.value as any)}>
                <option value="active">active</option>
                <option value="expired">expired</option>
                <option value="terminated">terminated</option>
              </select>
            </Field>
            <Field label="Reminder Days">
              <input
                type="number"
                className={adminInput}
                value={reminderDays}
                onChange={(e) => setReminderDays(Number(e.target.value))}
                min={0}
                max={3650}
              />
            </Field>
          </div>

          <Field label="Notes (optional)">
            <textarea
              className={`${adminInput} h-auto py-2`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Catatan kontrak..."
            />
          </Field>

          <button className={adminPrimaryBtn}>
            <Plus className="size-4" /> Create
          </button>
        </form>
      </SectionCard>

      {/* List */}
      <SectionCard icon={<List className="size-4" />} title="List" subtitle={`${contracts.length} entri`}>
        {contracts.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">No contracts</p>
        ) : (
          <div className="space-y-2">
            {contracts.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3"
              >
                <div className="min-w-0 flex-1">
                  {editingId === c.id ? (
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      <input
                        className={adminInput}
                        value={editContractNumber}
                        onChange={(e) => setEditContractNumber(e.target.value)}
                        placeholder="Contract number"
                      />
                      <input
                        type="date"
                        className={adminInput}
                        value={editStartDate}
                        onChange={(e) => setEditStartDate(e.target.value)}
                      />
                      <input
                        type="date"
                        className={adminInput}
                        value={editEndDate}
                        onChange={(e) => setEditEndDate(e.target.value)}
                      />
                      <select
                        className={adminInput}
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as any)}
                      >
                        <option value="active">active</option>
                        <option value="expired">expired</option>
                        <option value="terminated">terminated</option>
                      </select>
                      <input
                        type="number"
                        className={adminInput}
                        value={editReminderDays}
                        onChange={(e) => setEditReminderDays(Number(e.target.value))}
                        min={0}
                        max={3650}
                      />
                      <input
                        className={`${adminInput} md:col-span-2`}
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        placeholder="Notes"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                        <FileText className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-slate-900">{c.contract_number}</span>
                          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize", contractStatusBadge(computedStatus(c)))}>
                            {computedStatus(c)}
                          </span>
                        </div>
                        <div className="mt-0.5 truncate text-xs text-slate-500">
                          {orgMap.get(c.organization_id) ?? `OrgID: ${c.organization_id}`} · {fmtDateHuman(c.start_date)} →{" "}
                          {fmtDateHuman(c.end_date)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {editingId === c.id ? (
                    <>
                      <button onClick={onUpdate} className={adminPrimaryBtn}>
                        <Check className="size-4" /> Save
                      </button>
                      <button onClick={cancelEdit} className={adminGhostBtn}>
                        <X className="size-4" /> Cancel
                      </button>
                    </>
                  ) : (
                    <button onClick={() => openEdit(c)} className={adminGhostBtn}>
                      <Pencil className="size-3.5" /> Edit
                    </button>
                  )}

                  <button
                    onClick={() => onDelete(c.id)}
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
