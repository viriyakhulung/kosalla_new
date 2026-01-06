"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getOrganizations } from "@/lib/organizations";
import { getLocations } from "@/lib/locations";
import { createUser, deleteUser, getMasterRoles, getUsers } from "@/lib/users";

type Org = { id: number; name: string };
type Loc = { id: number; name: string; organization_id: number };
type Role = { id: number; name: string; description?: string | null };

export default function AdminUsersPage() {
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const [orgs, setOrgs] = useState<Org[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [locs, setLocs] = useState<Loc[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<number | "">("");

  const [users, setUsers] = useState<any[]>([]);

  // form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [masterRoleId, setMasterRoleId] = useState<number | "">("");
  const [locationId, setLocationId] = useState<number | "">("");

  const selectedOrg = useMemo(
    () => orgs.find((o) => o.id === selectedOrgId),
    [orgs, selectedOrgId]
  );

  async function refreshUsers() {
    const json = await getUsers();
    // Laravel paginate: { data: [...], ... }
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

  useEffect(() => {
    (async () => {
      try {
        setError("");
        setLocs([]);
        setLocationId("");

        if (!selectedOrgId) return;

        // sesuai pola nested by org (yang sebelumnya kamu pakai)
        const json = await getLocations(Number(selectedOrgId));
        // biasanya paginate {data:[...]} atau list {data:[...]}
        const rows = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
        setLocs(rows);
      } catch (e: any) {
        setError(e?.message ?? "Gagal load locations");
      }
    })();
  }, [selectedOrgId]);

  async function onCreate() {
    try {
      setError("");

      if (!selectedOrgId) throw new Error("Organization wajib dipilih");
      if (!masterRoleId) throw new Error("Role wajib dipilih");

      await createUser({
        name,
        email,
        password,
        organization_id: Number(selectedOrgId),
        location_id: locationId ? Number(locationId) : null,
        master_role_id: Number(masterRoleId),
      });

      setName("");
      setEmail("");
      setPassword("");
      setMasterRoleId("");
      setLocationId("");

      await refreshUsers();
    } catch (e: any) {
      setError(e?.message ?? "Gagal create user");
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

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-slate-600">Add/Edit user accounts (1 user = 1 organization)</p>
        </div>
        <Link href="/admin" className="text-amber-600 hover:underline">
          ← Back to Admin
        </Link>
      </div>

      {error ? (
        <div className="border border-red-200 bg-red-50 text-red-700 p-4 rounded">
          {error}
        </div>
      ) : null}

      {/* Create */}
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <h2 className="text-xl font-semibold">Create User</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-600">Organization</label>
            <select
              className="mt-1 w-full border rounded p-2"
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">-- pilih organization --</option>
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} (ID: {o.id})
                </option>
              ))}
            </select>
            <div className="text-xs text-slate-500 mt-1">
              Selected: <b>{selectedOrg?.name ?? "-"}</b>
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-600">Location (optional)</label>
            <select
              className="mt-1 w-full border rounded p-2"
              value={locationId}
              onChange={(e) => setLocationId(e.target.value ? Number(e.target.value) : "")}
              disabled={!selectedOrgId}
            >
              <option value="">-- pilih location --</option>
              {locs.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} (ID: {l.id})
                </option>
              ))}
            </select>
            <div className="text-xs text-slate-500 mt-1">
              Location ikut Organization (nested)
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-600">Role (master_role)</label>
            <select
              className="mt-1 w-full border rounded p-2"
              value={masterRoleId}
              onChange={(e) => setMasterRoleId(e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">-- pilih role --</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} (ID: {r.id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-slate-600">Name</label>
            <input
              className="mt-1 w-full border rounded p-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama user"
            />
          </div>

          <div>
            <label className="text-sm text-slate-600">Email</label>
            <input
              className="mt-1 w-full border rounded p-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@domain.com"
            />
          </div>

          <div>
            <label className="text-sm text-slate-600">Password</label>
            <input
              className="mt-1 w-full border rounded p-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="min 6 char"
              type="password"
            />
          </div>
        </div>

        <button
          onClick={onCreate}
          className="bg-amber-500 text-white px-4 py-2 rounded hover:bg-amber-600"
        >
          Create
        </button>
      </div>

      {/* List */}
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <h2 className="text-xl font-semibold">List</h2>

        {users.length === 0 ? (
          <div className="text-slate-600">No users</div>
        ) : (
          <div className="space-y-3">
            {users.map((u) => (
              <div
                key={u.id}
                className="border rounded p-4 flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold">{u.name}</div>
                  <div className="text-sm text-slate-600">
                    Email: {u.email} • ID: {u.id}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Org: {u.organization?.name ?? "-"} • Loc: {u.location?.name ?? "-"} • Role:{" "}
                    {u.masterRole?.name ?? u.master_role?.name ?? "-"}
                  </div>
                </div>

                <button
                  onClick={() => onDelete(u.id)}
                  className="border px-3 py-2 rounded hover:bg-slate-50"
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
