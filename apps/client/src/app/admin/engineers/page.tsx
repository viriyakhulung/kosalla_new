"use client";

import { useEffect, useMemo, useState } from "react";
import { Wrench, Plus, List, Trash2, CircleCheck, CircleSlash } from "lucide-react";
import { createEngineer, deleteEngineer, getEngineerCandidates, getEngineers } from "@/lib/engineers";
import { PageHead, StatCard, SectionCard, Field, adminInput, adminPrimaryBtn, RowIcon } from "@/components/admin/ui";

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
      <PageHead
        icon={<Wrench className="size-5" />}
        title="Engineers"
        subtitle="Setup engineer internal (profil engineer per user)"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={<Wrench className="size-5" />} tone="teal" value={engineers.length} label="Total engineers" />
        <StatCard
          icon={<CircleCheck className="size-5" />}
          tone="emerald"
          value={engineers.filter((e) => e.is_active).length}
          label="Active"
        />
        <StatCard
          icon={<CircleSlash className="size-5" />}
          tone="slate"
          value={engineers.filter((e) => !e.is_active).length}
          label="Inactive"
        />
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      {/* create */}
      <SectionCard icon={<Plus className="size-4" />} title="Create Engineer">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="User">
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value ? Number(e.target.value) : "")}
              className={adminInput}
              disabled={busy || loading}
            >
              <option value="">— pilih user —</option>
              {candidates.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} — {u.email} (ID: {u.id})
                </option>
              ))}
            </select>
            {selectedCandidate ? (
              <p className="mt-1 text-xs text-slate-500">
                Selected: <b>{selectedCandidate.name}</b>
              </p>
            ) : null}
          </Field>

          <Field label="Title (optional)">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: DBA / Backend Engineer / Infra"
              className={adminInput}
              disabled={busy}
            />
          </Field>

          <Field label="Level">
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as any)}
              className={adminInput}
              disabled={busy}
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Phone (optional)">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08xxxxxxxxxx"
              className={adminInput}
              disabled={busy}
            />
          </Field>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              disabled={busy}
              className="size-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
            />
            Active
          </label>
        </div>

        <button onClick={onCreate} disabled={busy || loading} className={`${adminPrimaryBtn} mt-4`}>
          <Plus className="size-4" />
          {busy ? "Processing..." : "Create"}
        </button>
      </SectionCard>

      {/* list */}
      <SectionCard icon={<List className="size-4" />} title="List" subtitle={`${engineers.length} entri`}>
        {loading ? (
          <div className="py-6 text-center text-sm text-slate-400">Loading...</div>
        ) : engineers.length === 0 ? (
          <div className="py-6 text-center text-sm text-slate-400">Belum ada engineer</div>
        ) : (
          <div className="space-y-2">
            {engineers.map((eng) => (
              <div
                key={eng.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <RowIcon icon={<Wrench className="size-4" />} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-900">
                        {eng.user?.name ?? `User ID: ${eng.user_id}`}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                        {eng.level}
                      </span>
                      {eng.is_active ? (
                        <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-700">
                          Active
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-slate-500">
                      {eng.user?.email ?? "-"} · Title: {eng.title ?? "-"} · Phone: {eng.phone ?? "-"}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onDelete(eng.id)}
                  disabled={busy}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
                  aria-label="Delete"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
