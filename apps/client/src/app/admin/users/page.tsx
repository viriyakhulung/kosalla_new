"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Users,
  UserPlus,
  ShieldCheck,
  User as UserIcon,
  List,
  Trash2,
  X,
  Mail,
  Building2,
  MapPin,
  Phone,
  Home,
  KeyRound,
  Eye,
  EyeOff,
} from "lucide-react";
import { getOrganizations } from "@/lib/organizations";
import { getLocations } from "@/lib/locations";
import { createUser, deleteUser, getMasterRoles, getUsers, updateUser } from "@/lib/users";
import { PageHead, StatCard, SectionCard, Field, adminInput, adminPrimaryBtn, adminGhostBtn } from "@/components/admin/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
function fieldVal(value?: string | null): string {
  return value && String(value).trim() !== "" ? String(value) : "—";
}

export default function AdminUsersPage() {
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const [orgs, setOrgs] = useState<Org[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // drawer detail user (read-only)
  const [detailUser, setDetailUser] = useState<any | null>(null);

  // modal reset password (superadmin set password user lain)
  const [resetUser, setResetUser] = useState<any | null>(null);
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetOk, setResetOk] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // filter & search (eksekusi di backend)
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState(""); // "" = semua role
  const [total, setTotal] = useState(0);

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

  async function refreshUsers(params?: { search?: string; role?: string }) {
    const json = await getUsers(params);
    setUsers(Array.isArray(json?.data) ? json.data : []);
    setTotal(typeof json?.total === "number" ? json.total : (Array.isArray(json?.data) ? json.data.length : 0));
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
        // daftar user di-fetch oleh effect debounce (search/roleFilter) di bawah
      } catch (e: any) {
        setError(e?.message ?? "Gagal load data");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // fetch user saat search/roleFilter berubah (debounce 350ms) — termasuk load awal
  useEffect(() => {
    const t = setTimeout(() => {
      refreshUsers({ search, role: roleFilter }).catch((e: any) =>
        setError(e?.message ?? "Gagal load users")
      );
    }, 350);
    return () => clearTimeout(t);
  }, [search, roleFilter]);

  // tutup drawer detail dengan Esc
  useEffect(() => {
    if (!detailUser) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDetailUser(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [detailUser]);

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

      await refreshUsers({ search, role: roleFilter });
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
      await refreshUsers({ search, role: roleFilter });
    } catch (e: any) {
      setError(e?.message ?? "Gagal delete user");
    }
  }

  function openReset(u: any) {
    setResetUser(u);
    setNewPw("");
    setConfirmPw("");
    setResetError("");
    setResetOk(false);
    setShowNewPw(false);
    setShowConfirmPw(false);
  }

  // Validasi password selaras policy backend (UpdateUserRequest): min 8,
  // huruf besar+kecil, angka, simbol. Dicek di sini agar tidak hit API kalau lemah.
  function validatePw(pw: string): string | null {
    if (pw.length < 8) return "Password minimal 8 karakter.";
    if (!/[a-z]/.test(pw)) return "Harus ada huruf kecil.";
    if (!/[A-Z]/.test(pw)) return "Harus ada huruf besar.";
    if (!/[0-9]/.test(pw)) return "Harus ada angka.";
    if (!/[^A-Za-z0-9]/.test(pw)) return "Harus ada simbol.";
    return null;
  }

  async function onResetSubmit() {
    if (!resetUser) return;
    setResetError("");

    const pwErr = validatePw(newPw);
    if (pwErr) {
      setResetError(pwErr);
      return;
    }
    if (newPw !== confirmPw) {
      setResetError("Konfirmasi password tidak cocok.");
      return;
    }

    try {
      setResetLoading(true);
      await updateUser(resetUser.id, { password: newPw }); // endpoint existing
      setResetOk(true);
      setNewPw("");
      setConfirmPw("");
      setTimeout(() => setResetUser(null), 1200);
    } catch (e: any) {
      setResetError(e?.message ?? "Gagal reset password.");
    } finally {
      setResetLoading(false);
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
      <SectionCard
        icon={<List className="size-4" />}
        title="List"
        subtitle={
          search || roleFilter
            ? `Menampilkan ${users.length} dari ${total} user`
            : `${total} pengguna terdaftar`
        }
      >
        {/* Filter & Search */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            className={adminInput}
            placeholder="Cari nama atau email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className={cn(adminInput, "sm:max-w-[14rem]")}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">Semua role</option>
            {roles.map((r) => (
              <option key={r.id} value={r.name}>
                {roleBadge(r.name.toLowerCase()).label}
              </option>
            ))}
          </select>
        </div>

        {users.length === 0 ? (
          <div className="py-6 text-center text-sm text-slate-400">
            {search || roleFilter
              ? "Tidak ada user yang cocok dengan pencarian."
              : "No users"}
          </div>
        ) : (
          <div className="space-y-2">
            {users.map((u) => {
              const rb = roleBadge(userRoleName(u));
              return (
                <div
                  key={u.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setDetailUser(u)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setDetailUser(u);
                    }
                  }}
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 transition-colors hover:border-teal-300 hover:bg-teal-50/40"
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

                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openReset(u);
                      }}
                      className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-400 transition-colors hover:bg-teal-50 hover:text-teal-600"
                      aria-label="Reset password"
                      title="Reset password"
                    >
                      <KeyRound className="size-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(u.id);
                      }}
                      className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      aria-label="Delete"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* Drawer Detail User (read-only) */}
      <div
        className={cn(
          "fixed inset-0 z-40 transition-opacity duration-300",
          detailUser ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        {/* overlay */}
        <div
          className="absolute inset-0 bg-black/40"
          onClick={() => setDetailUser(null)}
        />

        {/* panel kanan */}
        <aside
          className={cn(
            "absolute right-0 top-0 flex h-full w-full max-w-[30rem] flex-col overflow-y-auto bg-white shadow-2xl transition-transform duration-300",
            detailUser ? "translate-x-0" : "translate-x-full"
          )}
        >
          {detailUser && (
            <>
              {/* header */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-5">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white">
                    {userInitials(detailUser.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-base font-bold text-slate-900">
                      {fieldVal(detailUser.name)}
                    </p>
                    <span
                      className={cn(
                        "mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                        roleBadge(userRoleName(detailUser)).cls
                      )}
                    >
                      {roleBadge(userRoleName(detailUser)).label}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailUser(null)}
                  aria-label="Tutup"
                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* body */}
              <div className="space-y-6 px-6 py-5">
                {/* Identitas */}
                <section className="space-y-3">
                  <h3 className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                    Identitas
                  </h3>
                  <DetailField icon={<Mail className="size-4" />} label="Email" value={fieldVal(detailUser.email)} />
                  <DetailField icon={<Building2 className="size-4" />} label="Organisasi" value={fieldVal(detailUser.organization?.name)} />
                  <DetailField icon={<MapPin className="size-4" />} label="Lokasi" value={fieldVal(detailUser.location?.name)} />
                </section>

                {/* Kontak */}
                <section className="space-y-3">
                  <h3 className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                    Kontak
                  </h3>
                  <DetailField icon={<Phone className="size-4" />} label="Telepon" value={fieldVal(detailUser.phone)} />
                  <DetailField icon={<Home className="size-4" />} label="Alamat" value={fieldVal(detailUser.address_line)} />
                  <DetailField icon={<Building2 className="size-4" />} label="Kota" value={fieldVal(detailUser.city)} />
                  <DetailField icon={<MapPin className="size-4" />} label="Kode Pos" value={fieldVal(detailUser.postal_code)} />
                </section>
              </div>
            </>
          )}
        </aside>
      </div>

      {/* Modal Reset Password (superadmin set password user lain) */}
      <Dialog open={!!resetUser} onOpenChange={(o) => { if (!o) setResetUser(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="size-5 text-teal-600" /> Reset Password
            </DialogTitle>
            <DialogDescription>
              Set password baru untuk <b>{resetUser?.name}</b>. User akan login dengan password ini.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPw ? "text" : "password"}
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  placeholder="Min 8 char, huruf besar/kecil, angka, simbol"
                  className={cn(adminInput, "pr-10")}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 transition-colors hover:text-slate-600"
                  aria-label={showNewPw ? "Sembunyikan password" : "Tampilkan password"}
                  tabIndex={-1}
                >
                  {showNewPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPw ? "text" : "password"}
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder="Ulangi password baru"
                  className={cn(adminInput, "pr-10")}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 transition-colors hover:text-slate-600"
                  aria-label={showConfirmPw ? "Sembunyikan password" : "Tampilkan password"}
                  tabIndex={-1}
                >
                  {showConfirmPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            {resetError && <p className="text-sm text-red-600">{resetError}</p>}
            {resetOk && <p className="text-sm text-teal-600">Password berhasil diubah.</p>}
          </div>

          <DialogFooter>
            <button className={adminGhostBtn} onClick={() => setResetUser(null)} disabled={resetLoading}>
              Cancel
            </button>
            <button className={adminPrimaryBtn} onClick={onResetSubmit} disabled={resetLoading}>
              {resetLoading ? "Menyimpan..." : "Save Password"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailField({
  icon,
  label,
  value,
}: {
  icon?: ReactNode;
  label: string;
  value: string;
}) {
  const empty = value === "—";
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        {icon && <span className="text-slate-400">{icon}</span>}
        <p className={cn("truncate text-sm font-semibold", empty ? "italic text-slate-300" : "text-slate-900")}>
          {value}
        </p>
      </div>
    </div>
  );
}
