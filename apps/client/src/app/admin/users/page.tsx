"use client";

import { useEffect, useMemo, useState } from "react";
import { Users, UserPlus, ShieldCheck, User as UserIcon, List, Trash2 } from "lucide-react";
import { getOrganizations } from "@/lib/organizations";
import { getLocations } from "@/lib/locations";
import { createUser, deleteUser, getMasterRoles, getUsers } from "@/lib/users";
import { PageHead, StatCard, SectionCard, Field, adminInput } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

type Org = { id: number; name: string };
type Loc = { id: number; name: string; organization_id: number };
type Role = { id: number; name: string; description?: string | null };

function userRoleName(u: any): string {
  return String(u?.masterRole?.name ?? u?.master_role?.name ?? "").toLowerCase();
}
function roleBadge(role: string): { label: string; cls: string } {
  if (role === "superadmin") return { label: "Super Admin", cls: "bg-rose-50 text-rose-600 border border-rose-200" };
  if (role === "viriyastaff") return { label: "Viriya Staff", cls: "bg-amber-50 text-amber-700 border border-amber-200" };
  if (role === "custstaff") return { label: "Customer Staff", cls: "bg-slate-100 text-slate-600 border border-slate-200" };
  return { label: role || "-", cls: "bg-slate-100 text-slate-600 border border-slate-200" };
}
function userInitials(name?: string | null): string {
  return (
    String(name ?? "").trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "U"
  );
}

export default function AdminUsersPage() {
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const [orgs, setOrgs] = useState<Org[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // locations (hidden in UI, but used for auto-assign)
  const [locs, setLocs] = useState<Loc[]>([]);
  const [loadingLocs, setLoadingLocs] = useState(false);

  // form
  const [selectedOrgId, setSelectedOrgId] = useState<number | "">("");
  const [masterRoleId, setMasterRoleId] = useState<number | "">("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // hidden location_id (auto)
  const [locationId, setLocationId] = useState<number | "">("");

  const [creating, setCreating] = useState(false);

  const selectedOrg = useMemo(
    () => orgs.find((o) => o.id === selectedOrgId),
    [orgs, selectedOrgId]
  );

  const autoLocation = useMemo(() => {
    if (!selectedOrgId) return null;
    if (locationId !== "" && locationId !== null) {
      return locs.find((l) => l.id === Number(locationId)) ?? null;
    }
    return locs[0] ?? null;
  }, [selectedOrgId, locs, locationId]);

  async function refreshUsers() {
    const json = await getUsers();
    setUsers(Array.isArray(json?.data) ? json.data : []);
  }

  useEffect(() => {
    (async () => {
      try {
        setError("");
        setLoading(true);

        const [orgJson, roleJson] = await Promise.all([
          getOrganizations(),
          getMasterRoles(),
        ]);

        const orgsArr = Array.isArray(orgJson)
          ? orgJson
          : Array.isArray((orgJson as any)?.data)
          ? (orgJson as any).data
          : [];

        setOrgs(orgsArr);
        setRoles(Array.isArray(roleJson) ? roleJson : []);

        await refreshUsers();
      } catch (e: any) {
        setError(e?.message ?? "Gagal load data");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // fetch locations when org changes (hidden)
  useEffect(() => {
    (async () => {
      try {
        setError("");
        setLocs([]);
        setLocationId("");

        if (!selectedOrgId) return;

        setLoadingLocs(true);
        const json = await getLocations(Number(selectedOrgId));

        // lib/getLocations biasanya sudah return array, tapi kita tetap robust:
        const rows = Array.isArray(json)
          ? (json as any[])
          : Array.isArray((json as any)?.data)
          ? (json as any).data
          : [];

        setLocs(rows as Loc[]);

        // AUTO: pakai lokasi pertama (kalau single location ya otomatis benar)
        if (rows.length >= 1) {
          setLocationId((rows[0] as any).id);
        } else {
          setLocationId("");
        }
      } catch (e: any) {
        setError(e?.message ?? "Gagal load locations");
      } finally {
        setLoadingLocs(false);
      }
    })();
  }, [selectedOrgId]);

  async function onCreate() {
    try {
      setError("");

      if (!selectedOrgId) throw new Error("Organization wajib dipilih");
      if (!masterRoleId) throw new Error("Role wajib dipilih");
      if (!name.trim()) throw new Error("Name wajib diisi");
      if (!email.trim()) throw new Error("Email wajib diisi");
      if (!password.trim()) throw new Error("Password wajib diisi");

      // karena location hidden, kita wajib pastikan org punya minimal 1 location
      const resolvedLocationId =
        locationId !== "" && locationId !== null
          ? Number(locationId)
          : locs.length >= 1
          ? locs[0].id
          : null;

      if (!resolvedLocationId) {
        throw new Error("Organization belum punya Location. Buat Location dulu.");
      }

      setCreating(true);

      await createUser({
        name: name.trim(),
        email: email.trim(),
        password,
        organization_id: Number(selectedOrgId),
        location_id: resolvedLocationId, // tetap terisi walau UI disembunyikan
        master_role_id: Number(masterRoleId),
      });

      // reset field yang user input saja
      setName("");
      setEmail("");
      setPassword("");
      // jangan reset org/role/location -> biar bisa create cepat tanpa null lagi

      await refreshUsers();
    } catch (e: any) {
      setError(e?.message ?? "Gagal create user");
    } finally {
      setCreating(false);
    }
  }

  async function onDelete(id: number) {
    try {
      setError("");
      await deleteUser(id);
      await refreshUsers();
    } catch (e: any) {
      setError(e?.message ?? "Gagal delete user");
    }
  }

  const canCreate =
    !!selectedOrgId &&
    !!masterRoleId &&
    !!name.trim() &&
    !!email.trim() &&
    !!password.trim() &&
    !loadingLocs &&
    !creating &&
    // karena location hidden, kita require org punya minimal 1 location
    (locationId !== "" || locs.length >= 1);

  if (loading) return <div className="py-10 text-center text-sm text-slate-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <PageHead
        icon={<Users className="size-5" />}
        title="Users"
        subtitle="Kelola akun pengguna sistem · 1 user = 1 organisasi"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={<Users className="size-5" />} tone="teal" value={users.length} label="Total users" />
        <StatCard
          icon={<ShieldCheck className="size-5" />}
          tone="amber"
          value={users.filter((u) => ["superadmin", "viriyastaff"].includes(userRoleName(u))).length}
          label="Viriya staff & admin"
        />
        <StatCard
          icon={<UserIcon className="size-5" />}
          tone="blue"
          value={users.filter((u) => userRoleName(u) === "custstaff").length}
          label="Customer staff"
        />
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      {/* Create */}
      <SectionCard icon={<UserPlus className="size-4" />} title="Create User">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Field label="Organization">
              <select
                className={adminInput}
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value ? Number(e.target.value) : "")}
              >
                <option value="">— pilih organization —</option>
                {orgs.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} (ID: {o.id})
                  </option>
                ))}
              </select>
            </Field>

            <div className="mt-1 text-xs text-slate-500">
              Selected: <b>{selectedOrg?.name ?? "-"}</b>
              {loadingLocs ? <span className="ml-2 text-slate-400">(loading location...)</span> : null}
            </div>

            {selectedOrgId ? (
              <div className="mt-1 text-xs text-slate-500">
                Location:{" "}
                {autoLocation ? (
                  <b>
                    {autoLocation.name} (ID: {autoLocation.id})
                  </b>
                ) : (
                  <span className="text-red-600">
                    Org ini belum punya location (Create user akan ditolak)
                  </span>
                )}
                {locs.length > 1 ? (
                  <span className="ml-2 text-amber-600">(auto pakai lokasi pertama)</span>
                ) : locs.length === 1 ? (
                  <span className="ml-2 text-slate-400">(auto-selected)</span>
                ) : null}
              </div>
            ) : null}
          </div>

          <Field label="Role (master_role)">
            <select
              className={adminInput}
              value={masterRoleId}
              onChange={(e) => setMasterRoleId(e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">— pilih role —</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} (ID: {r.id})
                </option>
              ))}
            </select>
          </Field>

          <Field label="Name">
            <input
              className={adminInput}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama user"
            />
          </Field>

          <Field label="Email">
            <input
              className={adminInput}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@domain.com"
            />
          </Field>

          <Field label="Password">
            <input
              className={adminInput}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="min 6 karakter"
              type="password"
            />
          </Field>
        </div>

        <button
          onClick={onCreate}
          disabled={!canCreate}
          className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <UserPlus className="size-4" />
          {creating ? "Creating..." : "Create User"}
        </button>
      </SectionCard>

      {/* List */}
      <SectionCard icon={<List className="size-4" />} title="List" subtitle={`${users.length} pengguna terdaftar`}>
        {users.length === 0 ? (
          <div className="py-6 text-center text-sm text-slate-400">No users</div>
        ) : (
          <div className="space-y-2">
            {users.map((u) => {
              const rb = roleBadge(userRoleName(u));
              return (
                <div
                  key={u.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white">
                      {userInitials(u.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-900">{u.name}</span>
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", rb.cls)}>
                          {rb.label}
                        </span>
                      </div>
                      <div className="mt-0.5 truncate text-xs text-slate-500">
                        <span className="text-teal-600">{u.email}</span> · ID: {u.id} · Org:{" "}
                        {u.organization?.name ?? "-"} · Loc: {u.location?.name ?? "-"}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onDelete(u.id)}
                    className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    aria-label="Delete"
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
