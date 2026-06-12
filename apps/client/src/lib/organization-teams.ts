// Lib untuk fitur organisation_attach_teams (attach/detach tim ke organisasi).
// Endpoint admin:
//   GET    /api/admin/organizations/{org}/teams
//   POST   /api/admin/organizations/{org}/teams   body: { team_group_id }
//   DELETE /api/admin/organizations/{org}/teams/{teamGroup}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api.kosalla.viriyadb.com";

export type Organization = {
  id: number;
  name: string;
  slug?: string | null;
  is_active?: boolean;
};

export type TeamGroup = {
  id: number;
  name: string;
  code: string;
  is_active: boolean;
};

async function apiFetch(token: string | null, path: string, init: RequestInit = {}) {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (init.body) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { ...headers, ...(init.headers as Record<string, string> | undefined) },
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message ?? `Request failed (${res.status})`);
  return data;
}

/** Ambil array dari berbagai bentuk response (array langsung atau { data: [...] }). */
function pickArray(json: unknown): unknown[] {
  if (Array.isArray(json)) return json;
  if (json && typeof json === "object") {
    const obj = json as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data;
  }
  return [];
}

/** Semua organisasi (untuk dropdown pilih org). */
export async function getOrganizations(token: string | null): Promise<Organization[]> {
  const json = await apiFetch(token, "/api/admin/organizations");
  return pickArray(json) as Organization[];
}

/** Semua team group (untuk dropdown attach). */
export async function getTeamGroups(token: string | null): Promise<TeamGroup[]> {
  const json = await apiFetch(token, "/api/admin/team-groups");
  return pickArray(json) as TeamGroup[];
}

/** Tim yang sudah di-attach ke org tertentu. Controller balas { attached, available }. */
export async function getOrgTeams(token: string | null, orgId: number): Promise<TeamGroup[]> {
  const json = await apiFetch(token, `/api/admin/organizations/${orgId}/teams`);
  if (json && typeof json === "object" && Array.isArray((json as Record<string, unknown>).attached)) {
    return (json as { attached: TeamGroup[] }).attached;
  }
  return pickArray(json) as TeamGroup[];
}

/** Attach satu tim ke org (idempoten di backend via syncWithoutDetaching). */
export async function attachTeam(token: string | null, orgId: number, teamGroupId: number) {
  return apiFetch(token, `/api/admin/organizations/${orgId}/teams`, {
    method: "POST",
    body: JSON.stringify({ team_group_id: teamGroupId }),
  });
}

/** Detach satu tim dari org. */
export async function detachTeam(token: string | null, orgId: number, teamGroupId: number) {
  return apiFetch(token, `/api/admin/organizations/${orgId}/teams/${teamGroupId}`, {
    method: "DELETE",
  });
}
