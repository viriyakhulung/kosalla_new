"use client";

import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";

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
    <div className="space-y-4">
      {/* INFO */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
        <div className="text-sm text-slate-700">
          Halaman ini untuk mengatur akses user internal terkait User Articles:
          <ul className="list-disc pl-5 mt-2 text-slate-600">
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
      </div>

      {/* PICK USER + MODE */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-end gap-3 justify-between">
          <div className="w-full">
            <label className="text-xs font-semibold text-slate-600">Search user (email / name)</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="contoh: lung@ / khulung / superadmin@..."
            />
          </div>

          <div className="flex gap-2">
            <button
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
              onClick={() => loadUsers().catch(() => {})}
              disabled={loading}
            >
              Refresh
            </button>
          </div>
        </div>

        {err ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>
        ) : null}
        {okMsg ? (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{okMsg}</div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-600">Pick user (internal role 1/2)</label>

            <div className="mt-1 rounded-xl border border-slate-200 overflow-hidden">
              {loading ? (
                <div className="p-4 text-sm text-slate-500">Loading...</div>
              ) : filtered.length === 0 ? (
                <div className="p-4 text-sm text-slate-500">Tidak ada user.</div>
              ) : (
                filtered.map((u) => {
                  const active = pickedUser?.id === u.id;
                  const m = guessMode(u);
                  return (
                    <button
                      key={u.id}
                      className={[
                        "w-full text-left px-4 py-3 text-sm border-b last:border-b-0",
                        active ? "bg-slate-50" : "hover:bg-slate-50",
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
                          <div className="text-xs text-slate-600">
                            {u.name ?? "-"} • role: {roleLabel(u.master_role_id)}
                          </div>
                        </div>

                        <div className="text-xs text-slate-600">
                          mode: <b>{m}</b>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600">Access mode</label>
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white disabled:opacity-60"
              value={mode}
              onChange={(e) => setMode(e.target.value as Mode)}
              disabled={!pickedUser}
            >
              <option value="create_publish">create_publish (Create + Publish)</option>
              <option value="review_only">review_only (Reviewer saja)</option>
              <option value="none">none (Disable)</option>
              <option value="create_review_publish">create_review_publish (Create + Review + Publish)</option>
            </select>

            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
              User terpilih: <b>{pickedUser ? pickedUser.email : "-"}</b>
              <div className="mt-2 text-slate-600">
                Flag sekarang:
                <ul className="list-disc pl-5 mt-1">
                  <li>can_create: {String(!!pickedUser?.can_create)}</li>
                  <li>can_review: {String(!!pickedUser?.can_review)}</li>
                  <li>can_publish: {String(!!pickedUser?.can_publish)}</li>
                </ul>
              </div>
            </div>

            <button
              className="mt-3 w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
              disabled={!pickedUser || saving}
              onClick={() => save().catch(() => {})}
            >
              {saving ? "Saving..." : "Save Access"}
            </button>
          </div>
        </div>
      </div>

      <div className="text-xs text-slate-500">
        Tips: set minimal 1 user internal menjadi <b>review_only</b> (can_review=true) supaya bisa membuka reviewer queue.
      </div>
    </div>
  );
}
