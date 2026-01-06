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

export async function getEngineers() {
  return apiFetch("/api/admin/engineers");
}

export async function getEngineerCandidates() {
  return apiFetch("/api/admin/engineers/candidates");
}

export async function createEngineer(payload: any) {
  return apiFetch("/api/admin/engineers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteEngineer(id: number) {
  return apiFetch(`/api/admin/engineers/${id}`, { method: "DELETE" });
}
