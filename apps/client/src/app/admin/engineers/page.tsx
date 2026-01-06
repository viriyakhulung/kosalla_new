"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createEngineer, deleteEngineer, getEngineerCandidates, getEngineers } from "@/lib/engineers";

type CandidateUser = {
  id: number;
  name: string;
  email: string;
};

type EngineerRow = {
  id: number;
  user_id: number;
  title?: string | null;
  level: string;
  phone?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
};

const LEVELS = ["junior", "mid", "senior", "lead"] as const;

export default function EngineersPage() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>("");

  const [engineers, setEngineers] = useState<EngineerRow[]>([]);
  const [candidates, setCandidates] = useState<CandidateUser[]>([]);

  // form state
  const [userId, setUserId] = useState<number | "">("");
  const [title, setTitle] = useState<string>("");
  const [level, setLevel] = useState<(typeof LEVELS)[number]>("mid");
  const [phone, setPhone] = useState<string>("");
  const [isActive, setIsActive] = useState<boolean>(true);

  const selectedCandidate = useMemo(() => {
    if (userId === "") return null;
    return candidates.find((c) => c.id === userId) ?? null;
  }, [userId, candidates]);

  async function loadAll() {
    setError("");
    setLoading(true);
    try {
      // 1) list engineers (paginate)
      const engJson = await getEngineers();
      const engList: EngineerRow[] = engJson?.data ?? engJson?.data?.data ?? engJson?.data ?? [];
      // fallback: kalau backend return {data:[...]} vs {data:{data:[...]}}
      const normalized =
        Array.isArray(engJson?.data) ? engJson.data :
        Array.isArray(engJson?.data?.data) ? engJson.data.data :
        Array.isArray(engJson) ? engJson :
        [];

      setEngineers(normalized as EngineerRow[]);

      // 2) candidates
      const cand = await getEngineerCandidates();
      setCandidates(Array.isArray(cand) ? cand : cand?.data ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Gagal load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function onCreate() {
    setError("");
    if (userId === "") {
      setError("Pilih user terlebih dahulu");
      return;
    }

    try {
      setBusy(true);
      await createEngineer({
        user_id: userId,
        title: title.trim() || null,
        level,
        phone: phone.trim() || null,
        is_active: isActive,
      });

      // reset form
      setUserId("");
      setTitle("");
      setLevel("mid");
      setPhone("");
      setIsActive(true);

      // reload list + candidates
      await loadAll();
    } catch (e: any) {
      setError(e?.message ?? "Gagal create engineer");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: number) {
    setError("");
    const ok = confirm("Yakin hapus engineer ini?");
    if (!ok) return;

    try {
      setBusy(true);
      await deleteEngineer(id);
      await loadAll();
    } catch (e: any) {
      setError(e?.message ?? "Gagal delete engineer");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Engineers</h1>
          <p className="text-slate-600">Setup engineer internal (profil engineer per user)</p>
        </div>

        <Link href="/admin" className="text-amber-600 hover:underline font-semibold">
          ← Back to Admin
        </Link>
      </div>

      {/* error */}
      {error ? (
        <div className="border border-red-200 bg-red-50 text-red-700 rounded-lg p-4">
          {error}
        </div>
      ) : null}

      {/* create */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">Create Engineer</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* candidate */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">User</label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value ? Number(e.target.value) : "")}
              className="w-full border rounded-lg px-3 py-2"
              disabled={busy || loading}
            >
              <option value="">-- pilih user --</option>
              {candidates.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} — {u.email} (ID: {u.id})
                </option>
              ))}
            </select>
            {selectedCandidate ? (
              <p className="text-xs text-slate-500">
                Selected: <b>{selectedCandidate.name}</b>
              </p>
            ) : null}
          </div>

          {/* title */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Title (optional)</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: DBA / Backend Engineer / Infra"
              className="w-full border rounded-lg px-3 py-2"
              disabled={busy}
            />
          </div>

          {/* level */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Level</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as any)}
              className="w-full border rounded-lg px-3 py-2"
              disabled={busy}
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          {/* phone */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Phone (optional)</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08xxxxxxxxxx"
              className="w-full border rounded-lg px-3 py-2"
              disabled={busy}
            />
          </div>

          {/* active */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              disabled={busy}
            />
            <span className="text-sm text-slate-700">Active</span>
          </div>
        </div>

        <button
          onClick={onCreate}
          disabled={busy || loading}
          className="inline-flex items-center px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold disabled:opacity-60"
        >
          {busy ? "Processing..." : "Create"}
        </button>
      </div>

      {/* list */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">List</h2>

        {loading ? (
          <div className="text-slate-600">Loading...</div>
        ) : engineers.length === 0 ? (
          <div className="text-slate-600">Belum ada engineer</div>
        ) : (
          <div className="space-y-3">
            {engineers.map((eng) => (
              <div
                key={eng.id}
                className="border border-slate-200 rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-slate-900">
                    {eng.user?.name ?? `User ID: ${eng.user_id}`}
                  </div>
                  <div className="text-sm text-slate-600">
                    Email: {eng.user?.email ?? "-"} • EngineerID: {eng.id} • Level:{" "}
                    <b>{eng.level}</b> • Active: <b>{eng.is_active ? "yes" : "no"}</b>
                  </div>
                  <div className="text-sm text-slate-600">
                    Title: {eng.title ?? "-"} • Phone: {eng.phone ?? "-"}
                  </div>
                </div>

                <button
                  onClick={() => onDelete(eng.id)}
                  disabled={busy}
                  className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700"
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
