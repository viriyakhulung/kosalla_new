"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { UsersRound, UserPlus, List, Trash2, Crown, ShieldCheck } from "lucide-react";
import { PageHead, StatCard, SectionCard, Field, adminInput, adminPrimaryBtn, RowIcon } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ─── Local Types ──────────────────────────────────────────────────────────────

type TeamGroup = {
  id: number;
  name: string;
  code: string;
  is_active: boolean;
};

type UserLite = {
  id: number;
  name: string;
  email: string;
  master_role_id?: number | null;
  organization_id?: number | null;
};

type TeamMemberRole = "engineer-staff" | "engineer-manager" | "team-lead";

type Member = {
  id: number;
  name: string;
  email: string;
  master_role_id?: number | null;
  organization_id?: number | null;
  role: TeamMemberRole;
  is_active: boolean;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_OPTIONS: { value: TeamMemberRole; label: string }[] = [
  { value: "engineer-staff",   label: "Engineer Staff" },
  { value: "engineer-manager", label: "Engineer Manager" },
  { value: "team-lead",        label: "Team Lead" },
];

const ROLE_BADGE: Record<TeamMemberRole, string> = {
  "engineer-staff":   "bg-slate-100 text-slate-700",
  "engineer-manager": "bg-amber-100 text-amber-700",
  "team-lead":        "bg-green-100 text-green-700",
};

const ROLE_LABEL: Record<TeamMemberRole, string> = {
  "engineer-staff":   "Staff",
  "engineer-manager": "Manager",
  "team-lead":        "Team Lead",
};

// ─── API Helpers ──────────────────────────────────────────────────────────────

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

function pickArray(json: unknown): unknown[] {
  if (Array.isArray(json)) return json;
  if (json && typeof json === "object") {
    const obj = json as Record<string, unknown>;
    if (Array.isArray(obj.members)) return obj.members;
    if (Array.isArray(obj.data)) return obj.data;
    if (Array.isArray(obj.users)) return obj.users;
  }
  return [];
}

async function fetchTeamGroups(): Promise<TeamGroup[]> {
  const json = await apiFetch("/api/admin/team-groups");
  return pickArray(json) as TeamGroup[];
}

async function fetchUsers(): Promise<UserLite[]> {
  const json = await apiFetch("/api/admin/users/all");
  const all = pickArray(json) as UserLite[];
  // Hanya staf internal vendor (superadmin=1 / viriyastaff=2) yang boleh jadi
  // anggota team — selaras dengan guard backend & keamanan multi-tenant.
  return all.filter((u) => {
    const r = Number(u.master_role_id);
    return r === 1 || r === 2;
  });
}

async function fetchMembers(teamGroupId: number): Promise<Member[]> {
  const json = await apiFetch(`/api/admin/team-groups/${teamGroupId}/members`);
  return pickArray(json) as Member[];
}

async function apiAddMember(teamGroupId: number, userId: number, role: TeamMemberRole) {
  return apiFetch(`/api/admin/team-groups/${teamGroupId}/members`, {
    method: "POST",
    body: JSON.stringify({ user_id: userId, role }),
  });
}

async function apiRemoveMember(teamGroupId: number, userId: number) {
  return apiFetch(`/api/admin/team-groups/${teamGroupId}/members/${userId}`, {
    method: "DELETE",
  });
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default function TeamMembersPage() {
  const [teamGroups, setTeamGroups]           = useState<TeamGroup[]>([]);
  const [users, setUsers]                     = useState<UserLite[]>([]);
  const [selectedTeamGroupId, setSelectedTeamGroupId] = useState<number | null>(null);
  const [members, setMembers]                 = useState<Member[]>([]);

  // Separate loading states: init covers team-groups + users, members covers the list
  const [loadingInit, setLoadingInit]         = useState(true);
  const [loadingMembers, setLoadingMembers]   = useState(false);

  const [error, setError]     = useState("");
  const [adding, setAdding]   = useState(false);

  const [selectedUserId, setSelectedUserId]   = useState<number | null>(null);
  const [selectedRole, setSelectedRole]       = useState<TeamMemberRole>("engineer-staff");

  // Prevents state updates on unmounted component (StrictMode / fast navigation)
  const cancelledRef = useRef(false);

  const selectedTeamGroup = useMemo(
    () => teamGroups.find((tg) => tg.id === selectedTeamGroupId) ?? null,
    [teamGroups, selectedTeamGroupId]
  );

  useEffect(() => {
    cancelledRef.current = false;

    async function initialLoad() {
      setLoadingInit(true);
      setError("");

      try {
        // 1. Load team groups
        const tgs = await fetchTeamGroups();
        if (cancelledRef.current) return;
        setTeamGroups(tgs);

        const defaultId = tgs.length > 0 ? tgs[0].id : null;
        setSelectedTeamGroupId(defaultId);

        // 2. Load users for the Add Member dropdown (non-blocking on failure)
        try {
          const u = await fetchUsers();
          if (cancelledRef.current) return;
          setUsers(u);
          setSelectedUserId(u.length > 0 ? u[0].id : null);
        } catch (e: unknown) {
          if (cancelledRef.current) return;
          setUsers([]);
          setSelectedUserId(null);
          console.warn("Users endpoint not ready:", (e as Error)?.message);
        }

        // 3. Load members for the default team group
        if (defaultId) {
          setLoadingMembers(true);
          try {
            const m = await fetchMembers(defaultId);
            if (cancelledRef.current) return;
            setMembers(m);
          } catch {
            if (cancelledRef.current) return;
            setMembers([]);
          } finally {
            if (!cancelledRef.current) setLoadingMembers(false);
          }
        }
      } catch (e: unknown) {
        if (cancelledRef.current) return;
        setError((e as Error)?.message ?? "Gagal load data");
        setMembers([]);
      } finally {
        if (!cancelledRef.current) setLoadingInit(false);
      }
    }

    initialLoad();
    return () => { cancelledRef.current = true; };
  }, []);

  async function onChangeTeamGroup(id: number) {
    setSelectedTeamGroupId(id);
    setLoadingMembers(true);
    setError("");
    try {
      const m = await fetchMembers(id);
      setMembers(m);
    } catch (e: unknown) {
      setError((e as Error)?.message ?? "Gagal load members");
      setMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  }

  async function onAddMember() {
    if (!selectedTeamGroupId) { setError("Pilih team group dulu."); return; }
    if (!selectedUserId)      { setError("Pilih user dulu."); return; }

    setAdding(true);
    setError("");
    try {
      await apiAddMember(selectedTeamGroupId, selectedUserId, selectedRole);
      const m = await fetchMembers(selectedTeamGroupId);
      setMembers(m);
    } catch (e: unknown) {
      setError((e as Error)?.message ?? "Gagal add member");
    } finally {
      setAdding(false);
    }
  }

  async function onRemoveMember(userId: number) {
    if (!selectedTeamGroupId) return;
    if (!confirm("Yakin mau remove user ini dari team group?")) return;

    setError("");
    try {
      await apiRemoveMember(selectedTeamGroupId, userId);
      const m = await fetchMembers(selectedTeamGroupId);
      setMembers(m);
    } catch (e: unknown) {
      setError((e as Error)?.message ?? "Gagal remove member");
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (loadingInit) {
    return (
      <div className="space-y-6">
        <PageHead
          icon={<UsersRound className="size-5" />}
          title="Team Members"
          subtitle="Setup team member + role (by Team Group)"
        />
        <div className="py-10 text-center text-sm text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHead
        icon={<UsersRound className="size-5" />}
        title="Team Members"
        subtitle="Setup team member + role (by Team Group)"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={<UsersRound className="size-5" />} tone="teal" value={members.length} label="Total members" />
        <StatCard
          icon={<Crown className="size-5" />}
          tone="emerald"
          value={members.filter((m) => m.role === "team-lead").length}
          label="Team leads"
        />
        <StatCard
          icon={<ShieldCheck className="size-5" />}
          tone="amber"
          value={members.filter((m) => m.role === "engineer-manager").length}
          label="Managers"
        />
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      {/* ── Select Team Group ── */}
      <SectionCard icon={<UsersRound className="size-4" />} title="Select Team Group">
        <div className="flex flex-wrap items-center gap-4">
          <select
            className={`${adminInput} sm:max-w-md`}
            value={selectedTeamGroupId ?? ""}
            onChange={(e) => onChangeTeamGroup(Number(e.target.value))}
            disabled={teamGroups.length === 0}
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
          <p className="text-sm text-slate-500">
            Terpilih: <span className="font-semibold text-teal-700">{selectedTeamGroup?.name ?? "-"}</span>
          </p>
        </div>
      </SectionCard>

      {/* ── Add Member ── */}
      <SectionCard icon={<UserPlus className="size-4" />} title="Add Member">
        {users.length === 0 ? (
          <p className="text-sm text-slate-500">
            Endpoint user list belum tersedia. Member tetap bisa dilihat, tapi fitur add member butuh endpoint{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5">/api/admin/users/all</code>.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="User">
                <select
                  className={adminInput}
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
              </Field>

              <Field label="Role">
                <select
                  className={adminInput}
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as TeamMemberRole)}
                  disabled={adding}
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <button
              onClick={onAddMember}
              disabled={adding || !selectedTeamGroupId || !selectedUserId}
              className={`${adminPrimaryBtn} mt-4`}
            >
              <UserPlus className="size-4" />
              {adding ? "Adding…" : "Add Member"}
            </button>
          </>
        )}
      </SectionCard>

      {/* ── Members List ── */}
      <SectionCard icon={<List className="size-4" />} title="Members List" subtitle={`${members.length} member`}>
        {loadingMembers ? (
          <p className="py-6 text-center text-sm text-slate-400">Loading members…</p>
        ) : members.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">No members in this team group.</p>
        ) : (
          <div className="space-y-2">
            {members.map((m) => {
              const role = (m.role ?? "engineer-staff") as TeamMemberRole;
              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <RowIcon icon={<UsersRound className="size-4" />} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-900">{m.name}</span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                            ROLE_BADGE[role] ?? "bg-slate-100 text-slate-700"
                          )}
                        >
                          {ROLE_LABEL[role] ?? role}
                        </span>
                        {!m.is_active && (
                          <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-600">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {m.email} · ID: {m.id}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onRemoveMember(m.id)}
                    className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    aria-label="Remove"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
