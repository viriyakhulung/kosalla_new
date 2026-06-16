"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Info, Users, RefreshCw } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { SectionCard, Field, adminInput, adminPrimaryBtn, adminGhostBtn } from "@/components/admin/ui";

type User = {
  id: number;
  name?: string | null;
  email: string;
  master_role_id?: number | null;
  can_create?: boolean;
  can_review?: boolean;
  can_publish?: boolean;
};

type UsersResponse = { data: User[] } | User[];

function parseArray<T>(json: any): T[] {
  if (Array.isArray(json)) return json as T[];
  if (json?.data && Array.isArray(json.data)) return json.data as T[];
  return [];
}

function roleLabel(roleId?: number | null) {
  if (roleId === 1) return "superadmin";
  if (roleId === 2) return "viriyastaff";
  return String(roleId ?? "-");
}

type Mode = "none" | "review_only" | "create_publish"  |"create_review_publish";

function guessMode(u: User): Mode {
  const c = !!u.can_create;
  const r = !!u.can_review;
  const p = !!u.can_publish;

  if(c && r && p) return "create_review_publish";
  if (r && !c && !p) return "review_only";
  if (c && p && !r) return "create_publish";
  return "none";
}

export default function AdminUserArticlesAccessPage() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const [users, setUsers] = useState<User[]>([]);
  const [q, setQ] = useState("");

  const [pickedUser, setPickedUser] = useState<User | null>(null);
  const [mode, setMode] = useState<Mode>("create_publish");
  const [saving, setSaving] = useState(false);

  async function loadUsers(): Promise<User[]> {
    setLoading(true);
    setErr("");
    setOkMsg("");
    try {
      const json = await apiFetch<UsersResponse>("/admin/user-article-access");
      const list = parseArray<User>(json);

      // ✅ tampilkan hanya internal role 1/2
      const internal = list.filter((u) => u.master_role_id === 1 || u.master_role_id === 2);

      setUsers(internal);
      return internal;
    } catch (e: any) {
      setErr(e?.message || "Gagal load user access");
      setUsers([]);
      return [];
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    if (!kw) return users;
    return users.filter((u) => {
      const a = (u.email ?? "").toLowerCase();
      const b = (u.name ?? "").toLowerCase();
      return a.includes(kw) || b.includes(kw);
    });
  }, [users, q]);

  async function save() {
    if (!pickedUser) return;

    setSaving(true);
    setErr("");
    setOkMsg("");
    try {
      await apiFetch("/admin/user-article-access", {
        method: "POST",
        body: JSON.stringify({
          user_id: pickedUser.id,
          mode,
        }),
      });

      setOkMsg(`OK: akses ${pickedUser.email} di-set ke mode "${mode}".`);

      // reload biar update
      const fresh = await loadUsers();
      const refreshedPicked = fresh.find((u) => u.id === pickedUser.id) ?? null;
      setPickedUser(refreshedPicked);

      // kalau user masih ada, mode drop-down diset sesuai flag terbaru
      if (refreshedPicked) setMode(guessMode(refreshedPicked));
    } catch (e: any) {
      setErr(e?.message || "Gagal simpan akses");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* INFO */}
      <SectionCard icon={<Info className="size-4" />} iconTone="sky" title="Tentang Akses">
        <div className="text-sm text-slate-700">
          Halaman ini untuk mengatur akses user internal terkait User Articles:
          <ul className="mt-2 list-disc pl-5 text-slate-600">
            <li>
              <b>create_publish</b>: boleh create + publish, review off
            </li>
            <li>
              <b>review_only</b>: hanya reviewer
            </li>
            <li>
              <b>none</b>: disable semua
            </li>
          </ul>
          <div className="mt-2 text-xs text-slate-500">
            Catatan: modul ini tidak butuh organization_id, karena hanya mengatur akses user internal (role 1/2).
          </div>
        </div>
      </SectionCard>

      {/* PICK USER + MODE */}
      <SectionCard
        icon={<Users className="size-4" />}
        title="Atur Akses User"
        action={
          <button className={adminGhostBtn} onClick={() => loadUsers().catch(() => {})} disabled={loading}>
            <RefreshCw className="size-3.5" />
            Refresh
          </button>
        }
      >
        <Field label="Search user (email / name)">
          <input
            className={adminInput}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="contoh: lung@ / khulung / superadmin@..."
          />
        </Field>

        {err ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>
        ) : null}
        {okMsg ? (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            {okMsg}
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">Pick user (internal role 1/2)</label>

            <div className="overflow-hidden rounded-xl border border-slate-200">
              {loading ? (
                <div className="p-4 text-sm text-slate-400">Loading...</div>
              ) : filtered.length === 0 ? (
                <div className="p-4 text-sm text-slate-400">Tidak ada user.</div>
              ) : (
                filtered.map((u) => {
                  const active = pickedUser?.id === u.id;
                  const m = guessMode(u);
                  return (
                    <button
                      key={u.id}
                      className={[
                        "w-full border-b border-slate-100 px-4 py-3 text-left text-sm transition-colors last:border-b-0",
                        active ? "bg-teal-50" : "hover:bg-slate-50",
                      ].join(" ")}
                      onClick={() => {
                        setPickedUser(u);
                        setMode(m === "none" ? "create_publish" : m);
                        setOkMsg("");
                        setErr("");
                      }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-semibold text-slate-900">{u.email}</div>
                          <div className="text-xs text-slate-500">
                            {u.name ?? "-"} · role: {roleLabel(u.master_role_id)}
                          </div>
                        </div>

                        <div className="text-xs text-slate-500">
                          mode: <b className="text-slate-700">{m}</b>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div>
            <Field label="Access mode">
              <select
                className={adminInput}
                value={mode}
                onChange={(e) => setMode(e.target.value as Mode)}
                disabled={!pickedUser}
              >
                <option value="create_publish">create_publish (Create + Publish)</option>
                <option value="review_only">review_only (Reviewer saja)</option>
                <option value="none">none (Disable)</option>
                <option value="create_review_publish">create_review_publish (Create + Review + Publish)</option>
              </select>
            </Field>

            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
              User terpilih: <b>{pickedUser ? pickedUser.email : "-"}</b>
              <div className="mt-2 text-slate-600">
                Flag sekarang:
                <ul className="mt-1 list-disc pl-5">
                  <li>can_create: {String(!!pickedUser?.can_create)}</li>
                  <li>can_review: {String(!!pickedUser?.can_review)}</li>
                  <li>can_publish: {String(!!pickedUser?.can_publish)}</li>
                </ul>
              </div>
            </div>

            <button
              className={`${adminPrimaryBtn} mt-3 w-full`}
              disabled={!pickedUser || saving}
              onClick={() => save().catch(() => {})}
            >
              {saving ? "Saving..." : "Save Access"}
            </button>
          </div>
        </div>
      </SectionCard>

      <div className="text-xs text-slate-500">
        Tips: set minimal 1 user internal menjadi <b>review_only</b> (can_review=true) supaya bisa membuka reviewer queue.
      </div>
    </>
  );
}
