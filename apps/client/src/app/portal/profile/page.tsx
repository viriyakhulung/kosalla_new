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
} from "lucide-react";
import { changePassword, logout } from "@/lib/auth";
import { cn } from "@/lib/utils";

type Profile = {
  name?: string | null;
  email?: string | null;
  organization?: { id: number; name?: string | null } | null;
  location?: { id: number; name?: string | null } | null;
  master_role?: string | null;
  role?: string | null;
};

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

  // modal reset password
  const [showReset, setShowReset] = useState(false);
  const [cp, setCp] = useState("");
  const [np, setNp] = useState("");
  const [npc, setNpc] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetOk, setResetOk] = useState("");

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
                <input
                  type="password"
                  className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                  placeholder="Enter your current password"
                  value={cp}
                  onChange={(e) => setCp(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <KeyRound className="size-3.5" /> New Password
                </label>
                <input
                  type="password"
                  className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                  placeholder="Enter your new password (min 8 chars)"
                  value={np}
                  onChange={(e) => setNp(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <Check className="size-3.5" /> Confirm New Password
                </label>
                <input
                  type="password"
                  className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                  placeholder="Confirm your new password"
                  value={npc}
                  onChange={(e) => setNpc(e.target.value)}
                />
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
