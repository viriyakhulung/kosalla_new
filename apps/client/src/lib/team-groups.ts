const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type TeamGroup = {
  id: number;
  name: string;
  code: string;
  is_active: boolean;
};

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("kosalla_token");
}

async function apiFetch(path: string, init: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = { Accept: "application/json" };

  if (init.body) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { ...headers, ...(init.headers as any) },
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message ?? `Request failed (${res.status})`);
  return data;
}

export async function getTeamGroups() {
  return apiFetch("/api/admin/team-groups");
}

export async function createTeamGroup(payload: {
  name: string;
  code: string;
  is_active?: boolean;
}) {
  return apiFetch("/api/admin/team-groups", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteTeamGroup(id: number) {
  return apiFetch(`/api/admin/team-groups/${id}`, { method: "DELETE" });
}
