const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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

export type TeamGroup = { id: number; name: string; code: string; is_active?: boolean };
export type UserLite = { id: number; name: string; email: string };

export async function getTeamGroups(): Promise<TeamGroup[]> {
  // asumsi endpoint team-groups kamu sudah ada (kalau belum, bilang ya, aku bikinin)
  const json = await apiFetch("/api/admin/team-groups");
  return json.data ?? json; // fleksibel kalau bentuk response beda
}

export async function getUsers(): Promise<UserLite[]> {
  const json = await apiFetch("/api/admin/users");
  return json.data;
}

export async function getMembers(teamGroupId: number): Promise<UserLite[]> {
  const json = await apiFetch(`/api/admin/team-groups/${teamGroupId}/members`);
  return json.data;
}

export async function assignMember(teamGroupId: number, userId: number) {
  return apiFetch(`/api/admin/team-groups/${teamGroupId}/members`, {
    method: "POST",
    body: JSON.stringify({ user_id: userId }),
  });
}

export async function removeMember(teamGroupId: number, userId: number) {
  return apiFetch(`/api/admin/team-groups/${teamGroupId}/members/${userId}`, {
    method: "DELETE",
  });
}
