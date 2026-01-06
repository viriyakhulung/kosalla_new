"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type Org = {
  id: number;
  name: string;
};

type TeamGroup = {
  id: number;
  organization_id?: number | null;
  name: string;
  code: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("kosalla_token");
}

async function apiFetch(path: string, init: RequestInit = {}) {
  const token = getToken();
  const url = `${API_URL}${path}`;

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (init.body) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, {
    ...init,
    headers: {
      ...headers,
      ...(init.headers as Record<string, string> | undefined),
    },
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message ?? `Request failed (${res.status})`);
  }

  return data;
}

// ---------- API helpers ----------
async function getOrganizations(): Promise<Org[]> {
  const json = await apiFetch("/api/admin/organizations");
  // bisa {data:[...]} (pagination) atau array langsung
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.data)) return json.data;
  return [];
}

async function getTeamGroups(orgId?: number | null): Promise<TeamGroup[]> {
  // kalau backend kamu nested-by-org, ganti ke:
  // const json = await apiFetch(`/api/admin/organizations/${orgId}/team-groups`);
  // untuk saat ini pakai non-nested:
  const q = orgId ? `?organization_id=${orgId}` : "";
  const json = await apiFetch(`/api/admin/team-groups${q}`);
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.data)) return json.data;
  return [];
}

async function createTeamGroup(payload: {
  organization_id: number;
  name: string;
  code: string;
  is_active: boolean;
}) {
  return apiFetch("/api/admin/team-groups", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

async function deleteTeamGroup(id: number) {
  return apiFetch(`/api/admin/team-groups/${id}`, {
    method: "DELETE",
  });
}

// ---------- UI ----------
export default function TeamGroupsPage() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);

  const [items, setItems] = useState<TeamGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [active, setActive] = useState(true);

  const selectedOrg = useMemo(
    () => orgs.find((o) => o.id === selectedOrgId) ?? null,
    [orgs, selectedOrgId]
  );

  async function refreshAll(orgId: number | null) {
    setError("");
    setLoading(true);
    try {
      // 1) orgs
      const orgList = await getOrganizations();
      setOrgs(orgList);

      // set default org kalau belum dipilih
      const effectiveOrgId =
        orgId ?? (orgList.length > 0 ? orgList[0].id : null);
      setSelectedOrgId(effectiveOrgId);

      // 2) team groups
      if (effectiveOrgId) {
        const list = await getTeamGroups(effectiveOrgId);
        setItems(list);
      } else {
        setItems([]);
      }
    } catch (e: any) {
      setError(e?.message ?? "Gagal load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshAll(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onChangeOrg(id: number) {
    setSelectedOrgId(id);
    setError("");
    setLoading(true);
    try {
      const list = await getTeamGroups(id);
      setItems(list);
    } catch (e: any) {
      setError(e?.message ?? "Gagal load team groups");
    } finally {
      setLoading(false);
    }
  }

  async function onCreate() {
    if (!selectedOrgId) {
      setError("Pilih organization dulu.");
      return;
    }
    if (!name.trim()) {
      setError("Name wajib diisi.");
      return;
    }
    if (!code.trim()) {
      setError("Code wajib diisi.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await createTeamGroup({
        organization_id: selectedOrgId,
        name: name.trim(),
        code: code.trim(),
        is_active: active,
      });

      // reset form
      setName("");
      setCode("");
      setActive(true);

      // refresh list
      const list = await getTeamGroups(selectedOrgId);
      setItems(list);
    } catch (e: any) {
      setError(e?.message ?? "Gagal create team group");
    } finally {
      setSubmitting(false);
    }
  }

  async function onDelete(id: number) {
    const ok = confirm("Yakin mau delete team group ini?");
    if (!ok) return;

    setError("");
    try {
      await deleteTeamGroup(id);
      if (selectedOrgId) {
        const list = await getTeamGroups(selectedOrgId);
        setItems(list);
      } else {
        setItems((prev) => prev.filter((x) => x.id !== id));
      }
    } catch (e: any) {
      setError(e?.message ?? "Gagal delete");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Team Groups</h1>
          <p className="text-slate-600 mt-1">
            Setup team group (DB, Apps, Integration, Infra)
          </p>
        </div>

        <Link
          href="/admin"
          className="text-sm font-semibold text-amber-600 hover:text-amber-700"
        >
          ← Back to Admin
        </Link>
      </div>

      {error ? (
        <div className="border border-red-200 bg-red-50 text-red-700 rounded-lg p-4">
          {error}
        </div>
      ) : null}

      {/* Select Organization */}
      <div className="bg-white rounded-lg shadow p-6 space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">
          Select Organization
        </h2>

        <select
          className="w-full border rounded-md p-3"
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

        <div className="text-sm text-slate-600">
          Selected:{" "}
          <span className="font-semibold text-slate-900">
            {selectedOrg?.name ?? "-"}
          </span>
        </div>
      </div>

      {/* Create Team Group */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Create Team Group
        </h2>

        <input
          className="w-full border rounded-md p-3"
          placeholder="Name (contoh: Database Team)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={submitting}
        />

        <input
          className="w-full border rounded-md p-3"
          placeholder="Code (contoh: db-team)"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          disabled={submitting}
        />

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            disabled={submitting}
          />
          Active
        </label>

        <button
          onClick={onCreate}
          disabled={submitting || !selectedOrgId}
          className="px-4 py-2 rounded-md bg-amber-500 text-white font-semibold disabled:opacity-50"
        >
          {submitting ? "Creating..." : "Create"}
        </button>
      </div>

      {/* List */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">List</h2>

        {loading ? (
          <div className="text-slate-600">Loading...</div>
        ) : items.length === 0 ? (
          <div className="text-slate-600">No team groups for this organization</div>
        ) : (
          <div className="space-y-3">
            {items.map((tg) => (
              <div
                key={tg.id}
                className="border rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-slate-900">{tg.name}</div>
                  <div className="text-sm text-slate-600 mt-1">
                    ID: {tg.id} • Code: {tg.code} • Active:{" "}
                    {tg.is_active ? "yes" : "no"}
                  </div>
                </div>

                <button
                  onClick={() => onDelete(tg.id)}
                  className="px-4 py-2 rounded-md border hover:bg-slate-50"
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
