"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type TeamGroup = {
  id: number;
  name: string;
  code: string;
  is_active: boolean;
};

type User = {
  id: number;
  name: string;
  email: string;
  master_role?: string | null;
  organization_id?: number | null;
  location_id?: number | null;
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

// Helper aman: pastiin balikannya selalu array
function pickArray(json: any): any[] {
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json?.members)) return json.members;
  if (Array.isArray(json?.users)) return json.users;
  return [];
}

async function getTeamGroups(): Promise<TeamGroup[]> {
  const json = await apiFetch("/api/admin/team-groups");
  return pickArray(json) as TeamGroup[];
}

async function getUsers(): Promise<User[]> {
  // Kalau endpoint ini belum ada → nanti kamu kasih tau, aku sesuaikan.
  const json = await apiFetch("/api/admin/users");
  return pickArray(json) as User[];
}

async function getTeamMembers(teamGroupId: number): Promise<User[]> {
  const json = await apiFetch(`/api/admin/team-groups/${teamGroupId}/members`);
  return pickArray(json) as User[];
}

async function addTeamMember(teamGroupId: number, payload: { user_id: number }) {
  return apiFetch(`/api/admin/team-groups/${teamGroupId}/members`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

async function removeTeamMember(teamGroupId: number, userId: number) {
  return apiFetch(`/api/admin/team-groups/${teamGroupId}/members/${userId}`, {
    method: "DELETE",
  });
}

export default function TeamMembersPage() {
  const [teamGroups, setTeamGroups] = useState<TeamGroup[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [selectedTeamGroupId, setSelectedTeamGroupId] = useState<number | null>(null);

  // ✅ penting: default array harus []
  const [members, setMembers] = useState<User[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [adding, setAdding] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const selectedTeamGroup = useMemo(
    () => teamGroups.find((tg) => tg.id === selectedTeamGroupId) ?? null,
    [teamGroups, selectedTeamGroupId]
  );

  async function initialLoad() {
    setLoading(true);
    setError("");

    try {
      const tgs = await getTeamGroups();
      setTeamGroups(tgs);

      // auto pilih team group pertama
      const defaultTG = tgs.length > 0 ? tgs[0].id : null;
      setSelectedTeamGroupId(defaultTG);

      // load users kandidat (untuk add)
      // kalau endpoint users belum ada, akan kena error -> tampilkan pesan tapi tetap lanjut list members
      try {
        const u = await getUsers();
        setUsers(u);
        setSelectedUserId(u.length > 0 ? u[0].id : null);
      } catch (e: any) {
        setUsers([]);
        setSelectedUserId(null);
        // jangan blok halaman, cukup warning
        console.warn("Users endpoint not ready:", e?.message);
      }

      if (defaultTG) {
        const m = await getTeamMembers(defaultTG);
        setMembers(m ?? []);
      } else {
        setMembers([]);
      }
    } catch (e: any) {
      setError(e?.message ?? "Gagal load data Team Members");
      setMembers([]); // ✅ pastikan tidak undefined
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    initialLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onChangeTeamGroup(id: number) {
    setSelectedTeamGroupId(id);
    setLoading(true);
    setError("");
    try {
      const m = await getTeamMembers(id);
      setMembers(m ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Gagal load members");
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }

  async function onAddMember() {
    if (!selectedTeamGroupId) return setError("Pilih team group dulu.");
    if (!selectedUserId) return setError("Pilih user dulu.");

    setAdding(true);
    setError("");
    try {
      await addTeamMember(selectedTeamGroupId, { user_id: selectedUserId });
      const m = await getTeamMembers(selectedTeamGroupId);
      setMembers(m ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Gagal add member");
    } finally {
      setAdding(false);
    }
  }

  async function onRemoveMember(userId: number) {
    if (!selectedTeamGroupId) return;
    const ok = confirm("Yakin mau remove user ini dari team group?");
    if (!ok) return;

    setError("");
    try {
      await removeTeamMember(selectedTeamGroupId, userId);
      const m = await getTeamMembers(selectedTeamGroupId);
      setMembers(m ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Gagal remove member");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Team Members</h1>
          <p className="text-slate-600 mt-1">Setup team member + role (by Team Group)</p>
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

      {/* Select Team Group */}
      <div className="bg-white rounded-lg shadow p-6 space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Select Team Group</h2>

        <select
          className="w-full border rounded-md p-3"
          value={selectedTeamGroupId ?? ""}
          onChange={(e) => onChangeTeamGroup(Number(e.target.value))}
          disabled={loading || teamGroups.length === 0}
        >
          {teamGroups.length === 0 ? (
            <option value="">(No team groups)</option>
          ) : (
            teamGroups.map((tg) => (
              <option key={tg.id} value={tg.id}>
                {tg.name} (Code: {tg.code}, ID: {tg.id})
              </option>
            ))
          )}
        </select>

        <div className="text-sm text-slate-600">
          Selected:{" "}
          <span className="font-semibold text-slate-900">
            {selectedTeamGroup?.name ?? "-"}
          </span>
        </div>
      </div>

      {/* Add Member */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Add Member</h2>

        {users.length === 0 ? (
          <div className="text-slate-600 text-sm">
            Endpoint user list belum tersedia / belum bisa diakses.  
            Member tetap bisa dilihat (list), tapi fitur add member butuh endpoint <code>/api/admin/users</code>.
          </div>
        ) : (
          <div className="space-y-3">
            <select
              className="w-full border rounded-md p-3"
              value={selectedUserId ?? ""}
              onChange={(e) => setSelectedUserId(Number(e.target.value))}
              disabled={adding}
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} — {u.email} (ID: {u.id})
                </option>
              ))}
            </select>

            <button
              onClick={onAddMember}
              disabled={adding || !selectedTeamGroupId || !selectedUserId}
              className="px-4 py-2 rounded-md bg-amber-500 text-white font-semibold disabled:opacity-50"
            >
              {adding ? "Adding..." : "Add Member"}
            </button>
          </div>
        )}
      </div>

      {/* List Members */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Members List</h2>

        {loading ? (
          <div className="text-slate-600">Loading...</div>
        ) : (members ?? []).length === 0 ? ( // ✅ aman walau members null
          <div className="text-slate-600">No members in this team group</div>
        ) : (
          <div className="space-y-3">
            {(members ?? []).map((m) => (
              <div
                key={m.id}
                className="border rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-slate-900">{m.name}</div>
                  <div className="text-sm text-slate-600 mt-1">
                    Email: {m.email} • ID: {m.id} • Role: {m.master_role ?? "-"}
                  </div>
                </div>

                <button
                  onClick={() => onRemoveMember(m.id)}
                  className="px-4 py-2 rounded-md border hover:bg-slate-50"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
