"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Building2, Network, UsersRound, List, Trash2, Link2 } from "lucide-react";
import { PageHead, SectionCard, Field, adminInput, adminPrimaryBtn, RowIcon } from "@/components/admin/ui";
import { cn } from "@/lib/utils";
import {
  getOrganizations,
  getTeamGroups,
  getOrgTeams,
  attachTeam,
  detachTeam,
  type Organization,
  type TeamGroup,
} from "@/lib/organization-teams";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("kosalla_token");
}

export default function OrganizationTeamsPage() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [teamGroups, setTeamGroups] = useState<TeamGroup[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const [attachedTeams, setAttachedTeams] = useState<TeamGroup[]>([]);

  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);

  const [loadingInit, setLoadingInit] = useState(true);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [attaching, setAttaching] = useState(false);
  const [error, setError] = useState("");

  const cancelledRef = useRef(false);

  const selectedOrg = useMemo(
    () => orgs.find((o) => o.id === selectedOrgId) ?? null,
    [orgs, selectedOrgId]
  );

  async function loadTeams(orgId: number) {
    setLoadingTeams(true);
    setError("");
    try {
      const t = await getOrgTeams(getToken(), orgId);
      if (cancelledRef.current) return;
      setAttachedTeams(t);
    } catch (e: unknown) {
      if (cancelledRef.current) return;
      setError((e as Error)?.message ?? "Gagal load tim organisasi");
      setAttachedTeams([]);
    } finally {
      if (!cancelledRef.current) setLoadingTeams(false);
    }
  }

  useEffect(() => {
    cancelledRef.current = false;

    async function init() {
      setLoadingInit(true);
      setError("");
      try {
        const token = getToken();
        const [orgList, tgList] = await Promise.all([
          getOrganizations(token),
          getTeamGroups(token).catch(() => [] as TeamGroup[]),
        ]);
        if (cancelledRef.current) return;

        setOrgs(orgList);
        setTeamGroups(tgList);
        setSelectedTeamId(tgList.length > 0 ? tgList[0].id : null);

        const defaultOrg = orgList.length > 0 ? orgList[0].id : null;
        setSelectedOrgId(defaultOrg);
        if (defaultOrg) await loadTeams(defaultOrg);
      } catch (e: unknown) {
        if (cancelledRef.current) return;
        setError((e as Error)?.message ?? "Gagal load data");
      } finally {
        if (!cancelledRef.current) setLoadingInit(false);
      }
    }

    init();
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  async function onChangeOrg(id: number) {
    setSelectedOrgId(id);
    await loadTeams(id);
  }

  async function onAttach() {
    if (!selectedOrgId) {
      setError("Pilih organisasi dulu.");
      return;
    }
    if (!selectedTeamId) {
      setError("Pilih team group dulu.");
      return;
    }
    // Cek client-side: tim sudah di-attach?
    if (attachedTeams.some((t) => t.id === selectedTeamId)) {
      setError("Tim sudah terdaftar di organisasi ini.");
      return;
    }

    setAttaching(true);
    setError("");
    try {
      await attachTeam(getToken(), selectedOrgId, selectedTeamId);
      await loadTeams(selectedOrgId);
    } catch (e: unknown) {
      setError((e as Error)?.message ?? "Gagal attach tim");
    } finally {
      setAttaching(false);
    }
  }

  async function onDetach(teamGroupId: number) {
    if (!selectedOrgId) return;
    if (!confirm("Yakin mau detach tim ini dari organisasi?")) return;

    setError("");
    try {
      await detachTeam(getToken(), selectedOrgId, teamGroupId);
      await loadTeams(selectedOrgId);
    } catch (e: unknown) {
      setError((e as Error)?.message ?? "Gagal detach tim");
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (loadingInit) {
    return (
      <div className="space-y-6">
        <PageHead
          icon={<Network className="size-5" />}
          title="Organization Teams"
          subtitle="Kelola tim yang menangani tiket per organisasi"
        />
        <div className="py-10 text-center text-sm text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHead
        icon={<Network className="size-5" />}
        title="Organization Teams"
        subtitle="Kelola tim yang menangani tiket per organisasi"
      />

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      {/* ── Section 1: Select Organization ── */}
      <SectionCard icon={<Building2 className="size-4" />} title="Select Organization">
        <div className="flex flex-wrap items-center gap-4">
          <select
            className={`${adminInput} sm:max-w-md`}
            value={selectedOrgId ?? ""}
            onChange={(e) => onChangeOrg(Number(e.target.value))}
            disabled={orgs.length === 0}
          >
            {orgs.length === 0 ? (
              <option value="">(No organizations)</option>
            ) : (
              orgs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} (ID: {o.id})
                </option>
              ))
            )}
          </select>
          <p className="text-sm text-slate-500">
            Terpilih: <span className="font-semibold text-teal-700">{selectedOrg?.name ?? "-"}</span>
          </p>
        </div>
      </SectionCard>

      {/* ── Section 2: Attach Team ── */}
      <SectionCard icon={<Link2 className="size-4" />} title="Attach Team">
        {teamGroups.length === 0 ? (
          <p className="text-sm text-slate-500">
            Belum ada team group. Buat dulu di{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5">/admin/team-groups</code>.
          </p>
        ) : (
          <>
            <Field label="Team Group">
              <select
                className={`${adminInput} sm:max-w-md`}
                value={selectedTeamId ?? ""}
                onChange={(e) => setSelectedTeamId(Number(e.target.value))}
                disabled={attaching}
              >
                {teamGroups.map((tg) => (
                  <option key={tg.id} value={tg.id}>
                    {tg.name} (Code: {tg.code}, ID: {tg.id})
                  </option>
                ))}
              </select>
            </Field>

            <button
              onClick={onAttach}
              disabled={attaching || !selectedOrgId || !selectedTeamId}
              className={`${adminPrimaryBtn} mt-4`}
            >
              <Link2 className="size-4" />
              {attaching ? "Attaching…" : "Attach Team"}
            </button>
          </>
        )}
      </SectionCard>

      {/* ── Section 3: Teams List ── */}
      <SectionCard
        icon={<List className="size-4" />}
        title="Teams List"
        subtitle={`${attachedTeams.length} tim di-attach`}
      >
        {loadingTeams ? (
          <p className="py-6 text-center text-sm text-slate-400">Loading tim…</p>
        ) : attachedTeams.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">Belum ada tim yang di-attach.</p>
        ) : (
          <div className="space-y-2">
            {attachedTeams.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <RowIcon icon={<UsersRound className="size-4" />} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-900">{t.name}</span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                          t.is_active ? "bg-green-100 text-green-700" : "bg-rose-50 text-rose-600"
                        )}
                      >
                        {t.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      Code: {t.code} · ID: {t.id}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onDetach(t.id)}
                  className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                  aria-label="Detach"
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
