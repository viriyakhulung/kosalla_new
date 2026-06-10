"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { UsersRound, Building2, Plus, List, Trash2, CircleCheck, CircleSlash } from "lucide-react";
import { PageHead, StatCard, SectionCard, Field, adminInput, adminPrimaryBtn, RowIcon } from "@/components/admin/ui";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type Org = { id: number; name: string };

type TeamGroup = {
  id: number;
  organization_id?: number | null;
  name: string;
  code: string;
  handles_category?: string | null;
  is_active: boolean;
  organization?: { id: number; name: string } | null;
};

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("kosalla_token");
}

async function apiFetch(path: string, init: RequestInit = {}) {
  const token = getToken();
  const url = `${API_URL}${path}`;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (init.body) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(url, {
    ...init,
    headers: { ...headers, ...(init.headers as Record<string, string> | undefined) },
    cache: "no-store",
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message ?? `Request failed (${res.status})`);
  return data;
}

async function getOrganizations(): Promise<Org[]> {
  const json = await apiFetch("/api/admin/organizations");
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.data)) return json.data;
  return [];
}

async function getTeamGroups(orgId?: number | null): Promise<TeamGroup[]> {
  const q = orgId ? `?organization_id=${orgId}` : "";
  const json = await apiFetch(`/api/admin/team-groups${q}`);
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.data)) return json.data;
  return [];
}

async function createTeamGroup(payload: {
  organization_id: number | null;
  name: string;
  code: string;
  handles_category: string | null;
  is_active: boolean;
}) {
  return apiFetch("/api/admin/team-groups", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

async function deleteTeamGroup(id: number) {
  return apiFetch(`/api/admin/team-groups/${id}`, { method: "DELETE" });
}

export default function TeamGroupsPage() {
  const [orgs, setOrgs]                   = useState<Org[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const [items, setItems]                 = useState<TeamGroup[]>([]);
  const [loading, setLoading]             = useState(true);
  const [submitting, setSubmitting]       = useState(false);
  const [error, setError]                 = useState("");

  // form fields
  const [name, setName]                     = useState("");
  const [code, setCode]                     = useState("");
  const [handlesCategory, setHandlesCategory] = useState("");
  const [active, setActive]               = useState(true);

  const cancelledRef = useRef(false);

  const selectedOrg = useMemo(
    () => orgs.find((o) => o.id === selectedOrgId) ?? null,
    [orgs, selectedOrgId]
  );

  async function refreshAll(orgId: number | null) {
    setError("");
    setLoading(true);
    try {
      const orgList = await getOrganizations();
      if (cancelledRef.current) return;
      setOrgs(orgList);

      const effectiveOrgId = orgId ?? (orgList.length > 0 ? orgList[0].id : null);
      setSelectedOrgId(effectiveOrgId);

      const list = effectiveOrgId ? await getTeamGroups(effectiveOrgId) : [];
      if (cancelledRef.current) return;
      setItems(list);
    } catch (e: unknown) {
      if (cancelledRef.current) return;
      setError((e as Error)?.message ?? "Gagal load data");
    } finally {
      if (!cancelledRef.current) setLoading(false);
    }
  }

  useEffect(() => {
    cancelledRef.current = false;
    refreshAll(null);
    return () => { cancelledRef.current = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onChangeOrg(id: number) {
    setSelectedOrgId(id);
    setError("");
    setLoading(true);
    try {
      const list = await getTeamGroups(id);
      setItems(list);
    } catch (e: unknown) {
      setError((e as Error)?.message ?? "Gagal load team groups");
    } finally {
      setLoading(false);
    }
  }

  async function onCreate() {
    if (!name.trim()) { setError("Name wajib diisi."); return; }
    if (!code.trim()) { setError("Code wajib diisi."); return; }

    setSubmitting(true);
    setError("");
    try {
      await createTeamGroup({
        organization_id:  selectedOrgId,
        name:             name.trim(),
        code:             code.trim(),
        handles_category: handlesCategory.trim() || null,
        is_active:        active,
      });
      setName(""); setCode(""); setHandlesCategory(""); setActive(true);
      const list = await getTeamGroups(selectedOrgId);
      setItems(list);
    } catch (e: unknown) {
      setError((e as Error)?.message ?? "Gagal create team group");
    } finally {
      setSubmitting(false);
    }
  }

  async function onDelete(id: number) {
    if (!confirm("Yakin mau delete team group ini?")) return;
    setError("");
    try {
      await deleteTeamGroup(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (e: unknown) {
      setError((e as Error)?.message ?? "Gagal delete");
    }
  }

  return (
    <div className="space-y-6">
      <PageHead
        icon={<UsersRound className="size-5" />}
        title="Team Groups"
        subtitle="Setup divisi/tim beserta kategori tiket yang ditangani"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={<UsersRound className="size-5" />} tone="teal" value={items.length} label="Total team groups" />
        <StatCard
          icon={<CircleCheck className="size-5" />}
          tone="emerald"
          value={items.filter((t) => t.is_active).length}
          label="Active"
        />
        <StatCard
          icon={<CircleSlash className="size-5" />}
          tone="slate"
          value={items.filter((t) => !t.is_active).length}
          label="Inactive"
        />
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      {/* Select Organization */}
      <SectionCard icon={<Building2 className="size-4" />} title="Select Organization">
        <div className="flex flex-wrap items-center gap-4">
          <select
            className={`${adminInput} sm:max-w-xs`}
            value={selectedOrgId ?? ""}
            onChange={(e) => onChangeOrg(Number(e.target.value))}
            disabled={loading || orgs.length === 0}
          >
            {orgs.length === 0 ? (
              <option value="">(No organizations)</option>
            ) : (
              orgs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} (ID: {o.id})
                </option>
              ))
            )}
          </select>
          <p className="text-sm text-slate-500">
            Terpilih: <span className="font-semibold text-teal-700">{selectedOrg?.name ?? "-"}</span>
          </p>
        </div>
      </SectionCard>

      {/* Create Team Group */}
      <SectionCard icon={<Plus className="size-4" />} title="Create Team Group">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Name" required>
            <input
              className={adminInput}
              placeholder="contoh: Apps Team"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
            />
          </Field>

          <Field label="Code" required>
            <input
              className={adminInput}
              placeholder="contoh: apps-team"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={submitting}
            />
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Handles Category">
            <input
              className={adminInput}
              placeholder="contoh: Application (harus sama persis dengan nilai Category di form tiket)"
              value={handlesCategory}
              onChange={(e) => setHandlesCategory(e.target.value)}
              disabled={submitting}
            />
          </Field>
          <p className="mt-1 text-xs text-slate-500">
            Isi ini agar tiket dengan category tersebut otomatis dirouting ke tim ini. Kosongkan jika tidak ingin
            routing otomatis.
          </p>
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            disabled={submitting}
            className="size-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
          />
          Active
        </label>

        <button onClick={onCreate} disabled={submitting} className={`${adminPrimaryBtn} mt-4`}>
          <Plus className="size-4" />
          {submitting ? "Creating…" : "Create"}
        </button>
      </SectionCard>

      {/* List */}
      <SectionCard icon={<List className="size-4" />} title="List" subtitle={`${items.length} entri`}>
        {loading ? (
          <p className="py-6 text-center text-sm text-slate-400">Loading…</p>
        ) : items.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">No team groups found.</p>
        ) : (
          <div className="space-y-2">
            {items.map((tg) => (
              <div
                key={tg.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <RowIcon icon={<UsersRound className="size-4" />} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-900">{tg.name}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                        {tg.code}
                      </span>
                      {tg.is_active ? (
                        <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-700">
                          Active
                        </span>
                      ) : (
                        <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-600">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      ID: {tg.id}
                      {tg.handles_category ? (
                        <>
                          {" "}· <span className="font-medium text-teal-700">Handles: &ldquo;{tg.handles_category}&rdquo;</span>
                        </>
                      ) : (
                        <> · <span className="text-slate-400">No routing category</span></>
                      )}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onDelete(tg.id)}
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
