const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api.kosalla.viriyadb.com";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("kosalla_token");
}

async function apiFetch(path: string, init: RequestInit = {}) {
  const token = getToken();
  const url = `${API_URL}${path}`;

  const headers: Record<string, string> = { Accept: "application/json" };
  if (init.body) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, {
    ...init,
    headers: { ...headers, ...(init.headers as any) },
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message ?? `Request failed (${res.status})`);
  return data;
}

export type TeamGroup = {
  id: number;
  name: string;
  code: string;
  is_active?: boolean;
  handles_category?: string | null;
  organization_id?: number | null;
};

export type UserLite = {
  id: number;
  name: string;
  email: string;
  master_role_id?: number | null;
  organization_id?: number | null;
};

export type TeamMemberRole = "engineer-staff" | "engineer-manager" | "team-lead";

export type TeamMember = {
  id: number;
  name: string;
  email: string;
  master_role_id?: number | null;
  organization_id?: number | null;
  location_id?: number | null;
  role: TeamMemberRole;
  is_active: boolean;
};

export async function getTeamGroups(): Promise<TeamGroup[]> {
  const json = await apiFetch("/api/admin/team-groups");
  return json.data ?? json;
}

export async function getUsers(): Promise<UserLite[]> {
  const json = await apiFetch("/api/admin/users/all");
  return json.data ?? [];
}

export async function getMembers(teamGroupId: number): Promise<TeamMember[]> {
  const json = await apiFetch(`/api/admin/team-groups/${teamGroupId}/members`);
  return json.members ?? json.data ?? [];
}

export async function addMember(
  teamGroupId: number,
  userId: number,
  role: TeamMemberRole = "engineer-staff"
) {
  return apiFetch(`/api/admin/team-groups/${teamGroupId}/members`, {
    method: "POST",
    body: JSON.stringify({ user_id: userId, role }),
  });
}

export async function updateMember(
  teamGroupId: number,
  userId: number,
  payload: { role?: TeamMemberRole; is_active?: boolean }
) {
  return apiFetch(`/api/admin/team-groups/${teamGroupId}/members/${userId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function removeMember(teamGroupId: number, userId: number) {
  return apiFetch(`/api/admin/team-groups/${teamGroupId}/members/${userId}`, {
    method: "DELETE",
  });
}
