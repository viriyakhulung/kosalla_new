const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  organization_id: number | null;
  location_id: number | null;
  master_role_id: number | null;
  organization?: any;
  location?: any;
  master_role?: any;
  masterRole?: any;
};

export async function getUsers() {
  return apiFetch("/api/admin/users"); // paginate object
}

export async function createUser(payload: {
  name: string;
  email: string;
  password: string;
  organization_id: number;
  location_id?: number | null;
  master_role_id: number;
}) {
  return apiFetch("/api/admin/users", { method: "POST", body: JSON.stringify(payload) });
}

export async function updateUser(id: number, payload: any) {
  return apiFetch(`/api/admin/users/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export async function deleteUser(id: number) {
  return apiFetch(`/api/admin/users/${id}`, { method: "DELETE" });
}

export async function getMasterRoles() {
  return apiFetch("/api/admin/master-roles");
}
