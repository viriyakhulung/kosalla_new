"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  RotateCcw,
  Mail,
  User,
  Building2,
  MapPin,
  ShieldCheck,
  Lock,
  KeyRound,
  Check,
  X,
  Loader2,
  Phone,
  Home,
  Save,
  Eye,
  EyeOff,
} from "lucide-react";
import { changePassword, logout, updateProfile } from "@/lib/auth";
import { cn } from "@/lib/utils";

type Profile = {
  name?: string | null;
  email?: string | null;
  organization?: { id: number; name?: string | null } | null;
  location?: { id: number; name?: string | null } | null;
  master_role?: string | null;
  role?: string | null;
  phone?: string | null;
  address_line?: string | null;
  city?: string | null;
  postal_code?: string | null;
};

type ContactForm = {
  phone: string;
  address_line: string;
  city: string;
  postal_code: string;
};

const inputClass =
  "h-10 w-full rounded-lg border border-slate-300 px-3 text-sm transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 disabled:bg-slate-50 disabled:text-slate-400";

function initials(name?: string | null): string {
  return (
    String(name ?? "")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "U"
  );
}

function ReadField({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  const empty = !value || value === "-";
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{label}</p>
      <div className="mt-1.5 flex items-center gap-2">
        {icon && <span className="text-slate-400">{icon}</span>}
        <p
          className={cn(
            "truncate text-sm font-semibold",
            empty ? "italic text-slate-300" : "text-slate-900"
          )}
        >
          {empty ? "Not specified" : value}
        </p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);

  // form edit kontak (telp + alamat)
  const [form, setForm] = useState<ContactForm>({
    phone: "",
    address_line: "",
    city: "",
    postal_code: "",
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveOk, setSaveOk] = useState("");

  // modal reset password
  const [showReset, setShowReset] = useState(false);
  const [cp, setCp] = useState("");
  const [np, setNp] = useState("");
  const [npc, setNpc] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetOk, setResetOk] = useState("");
  const [showCp, setShowCp] = useState(false);
  const [showNp, setShowNp] = useState(false);
  const [showNpc, setShowNpc] = useState(false);

  async function loadProfile() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/session", {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) {
        setError(`Gagal load profile (${res.status})`);
        setProfile(null);
        return;
      }

      const json = await res.json().catch(() => null);

      // normalize (session route: { ok:true, role, me:{...} } atau { ok:true, me:{ user:{...} } })
      const raw = json?.me ?? json?.user ?? null;
      const u = raw?.user ?? raw;

      if (!u) {
        setError("Data user tidak ditemukan dari session");
        setProfile(null);
        return;
      }

      setProfile({
        name: u?.name ?? null,
        email: u?.email ?? null,
        organization: u?.organization ?? null,
        location: u?.location ?? null,
        master_role: u?.master_role ?? u?.role ?? json?.role ?? null,
        role: u?.role ?? u?.master_role ?? json?.role ?? null,
        phone: u?.phone ?? null,
        address_line: u?.address_line ?? null,
        city: u?.city ?? null,
        postal_code: u?.postal_code ?? null,
      });

      // sinkronkan form edit dengan nilai existing
      setForm({
        phone: u?.phone ?? "",
        address_line: u?.address_line ?? "",
        city: u?.city ?? "",
        postal_code: u?.postal_code ?? "",
      });
    } catch (e: any) {
      setError(e?.message ?? "Failed to fetch /api/session");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  const openReset = () => {
    setResetError("");
    setResetOk("");
    setCp("");
    setNp("");
    setNpc("");
    setShowCp(false);
    setShowNp(false);
    setShowNpc(false);
    setShowReset(true);
  };

  const submitReset = async () => {
    setResetError("");
    setResetOk("");

    if (!cp.trim()) return setResetError("Current password wajib diisi.");
    if (!np.trim()) return setResetError("New password wajib diisi.");
    if (np.length < 8) return setResetError("New password minimal 8 karakter.");
    if (np !== npc) return setResetError("Password confirmation tidak sama.");

    try {
      setResetLoading(true);
      const res = await changePassword(cp, np, npc);

      setResetOk(res?.message ?? "Password berhasil diubah. Silakan login ulang.");

      // BE kamu revoke semua token => FE wajib logout supaya bersih
      await logout().catch(() => {});
      router.replace("/login");
    } catch (e: any) {
      setResetError(e?.message ?? "Gagal reset password");
    } finally {
      setResetLoading(false);
    }
  };

  async function handleSaveContact() {
    setSaving(true);
    setSaveError("");
    setSaveOk("");
    try {
      const res = await updateProfile({
        phone: form.phone.trim() || null,
        address_line: form.address_line.trim() || null,
        city: form.city.trim() || null,
        postal_code: form.postal_code.trim() || null,
      });

      // backend mengembalikan { user: {...} } identik GET /auth/me
      const u = (res as any)?.user ?? null;
      if (u) {
        setProfile((prev) => ({
          ...(prev ?? {}),
          phone: u?.phone ?? null,
          address_line: u?.address_line ?? null,
          city: u?.city ?? null,
          postal_code: u?.postal_code ?? null,
        }));
        setForm({
          phone: u?.phone ?? "",
          address_line: u?.address_line ?? "",
          city: u?.city ?? "",
          postal_code: u?.postal_code ?? "",
        });
      }

      setSaveOk("Profil berhasil diperbarui.");
    } catch (e: any) {
      setSaveError(e?.message ?? "Gagal menyimpan profil.");
    } finally {
      setSaving(false);
    }
  }

  const name = profile?.name ?? "-";
  const orgName = profile?.organization?.name ?? "";
  const roleLabel = profile?.master_role ?? profile?.role ?? "-";

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Informasi Akun</h2>
            <p className="text-sm text-slate-500">Informasi akun Anda saat ini.</p>
          </div>
          <button
            type="button"
            onClick={loadProfile}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-60"
          >
            <RotateCcw className={cn("size-4", loading && "animate-spin")} />
            Refresh
          </button>
        </div>

        {/* Body */}
        <div className="space-y-6 p-6">
          {loading ? (
            <div className="flex items-center gap-2 py-6 text-sm text-slate-400">
              <Loader2 className="size-4 animate-spin" /> Memuat profil…
            </div>
          ) : (
            <>
              {/* Avatar header */}
              <div className="flex items-center gap-4">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-teal-600 text-lg font-bold text-white">
                  {initials(name)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-base font-bold text-slate-900">{name}</p>
                  {orgName && <p className="truncate text-sm text-slate-500">{orgName}</p>}
                </div>
              </div>

              {/* Fields */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <ReadField
                  label="Nama"
                  value={name}
                  icon={<User className="size-4" />}
                />
                <ReadField
                  label="Email"
                  value={profile?.email ?? "-"}
                  icon={<Mail className="size-4" />}
                />
                <ReadField
                  label="Organisasi"
                  value={profile?.organization?.name ?? "-"}
                  icon={<Building2 className="size-4" />}
                />
                <ReadField
                  label="Lokasi"
                  value={profile?.location?.name ?? "-"}
                  icon={<MapPin className="size-4" />}
                />
                <div className="sm:col-span-2">
                  <ReadField
                    label="Role"
                    value={roleLabel}
                    icon={<ShieldCheck className="size-4" />}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={openReset}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-teal-600 transition-colors hover:text-teal-700"
                >
                  <Lock className="size-4" />
                  Reset Password
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Card Edit Kontak */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <h2 className="text-lg font-bold text-slate-900">Data Kontak</h2>
          <p className="text-sm text-slate-500">
            Lengkapi nomor telepon dan alamat Anda. Nama &amp; email tidak dapat diubah.
          </p>
        </div>

        <div className="space-y-4 p-6">
          {saveError && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <X className="mt-0.5 size-4 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}
          {saveOk && (
            <div className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              <Check className="mt-0.5 size-4 shrink-0" />
              <span>{saveOk}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Telepon */}
            <div className="sm:col-span-2">
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                <Phone className="size-3.5" /> Nomor Telepon
              </label>
              <input
                type="tel"
                inputMode="tel"
                maxLength={30}
                className={inputClass}
                placeholder="cth. 0811222333"
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    // hanya angka + karakter telepon umum (+, -, spasi, kurung)
                    phone: e.target.value.replace(/[^0-9+\-\s()]/g, ""),
                  }))
                }
                disabled={saving || loading}
              />
            </div>

            {/* Alamat */}
            <div className="sm:col-span-2">
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                <Home className="size-3.5" /> Alamat
              </label>
              <input
                type="text"
                maxLength={255}
                className={inputClass}
                placeholder="Jl. Contoh No. 123, RT/RW"
                value={form.address_line}
                onChange={(e) => setForm((f) => ({ ...f, address_line: e.target.value }))}
                disabled={saving || loading}
              />
            </div>

            {/* Kota */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                <Building2 className="size-3.5" /> Kota
              </label>
              <input
                type="text"
                maxLength={100}
                className={inputClass}
                placeholder="cth. Bandung"
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                disabled={saving || loading}
              />
            </div>

            {/* Kode Pos */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                <MapPin className="size-3.5" /> Kode Pos
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={10}
                className={inputClass}
                placeholder="cth. 40123"
                value={form.postal_code}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    // kode pos hanya digit
                    postal_code: e.target.value.replace(/\D/g, ""),
                  }))
                }
                disabled={saving || loading}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={handleSaveContact}
            disabled={saving || loading}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700 disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Menyimpan…
              </>
            ) : (
              <>
                <Save className="size-4" /> Simpan
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modal Reset Password */}
      {showReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-teal-100 text-teal-600">
                  <Lock className="size-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Reset Password</h3>
                  <p className="text-xs text-slate-500">Masukkan password lama dan password baru</p>
                </div>
              </div>
              <button
                type="button"
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                onClick={() => setShowReset(false)}
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              {resetError && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <X className="mt-0.5 size-4 shrink-0" />
                  <span>{resetError}</span>
                </div>
              )}
              {resetOk && (
                <div className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                  <Check className="mt-0.5 size-4 shrink-0" />
                  <span>{resetOk}</span>
                </div>
              )}

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <Lock className="size-3.5" /> Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCp ? "text" : "password"}
                    className="h-10 w-full rounded-lg border border-slate-300 px-3 pr-10 text-sm transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                    placeholder="Enter your current password"
                    value={cp}
                    onChange={(e) => setCp(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCp((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 transition-colors hover:text-slate-600"
                    aria-label={showCp ? "Sembunyikan password" : "Tampilkan password"}
                    tabIndex={-1}
                  >
                    {showCp ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <KeyRound className="size-3.5" /> New Password
                </label>
                <div className="relative">
                  <input
                    type={showNp ? "text" : "password"}
                    className="h-10 w-full rounded-lg border border-slate-300 px-3 pr-10 text-sm transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                    placeholder="Enter your new password (min 8 chars)"
                    value={np}
                    onChange={(e) => setNp(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNp((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 transition-colors hover:text-slate-600"
                    aria-label={showNp ? "Sembunyikan password" : "Tampilkan password"}
                    tabIndex={-1}
                  >
                    {showNp ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <Check className="size-3.5" /> Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showNpc ? "text" : "password"}
                    className="h-10 w-full rounded-lg border border-slate-300 px-3 pr-10 text-sm transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                    placeholder="Confirm your new password"
                    value={npc}
                    onChange={(e) => setNpc(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNpc((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 transition-colors hover:text-slate-600"
                    aria-label={showNpc ? "Sembunyikan password" : "Tampilkan password"}
                    tabIndex={-1}
                  >
                    {showNpc ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
              <button
                type="button"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-60"
                onClick={() => setShowReset(false)}
                disabled={resetLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700 disabled:opacity-60"
                onClick={submitReset}
                disabled={resetLoading}
              >
                {resetLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Saving…
                  </>
                ) : (
                  <>
                    <KeyRound className="size-4" /> Save Password
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
