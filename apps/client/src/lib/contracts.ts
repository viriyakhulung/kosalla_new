const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("kosalla_token");
}

async function apiFetch(path: string, init: RequestInit = {}) {
  const token = getToken();
  if (!token) throw new Error("Unauthenticated");

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message ?? `Request failed (${res.status})`);
  return json;
}

export type Contract = {
  id: number;
  organization_id: number;
  contract_number: string;
  start_date: string;
  end_date: string;
  status: "active" | "expired" | "terminated";
  reminder_days_before_end: number;
  notes?: string | null;
  organization?: { id: number; name: string };
};

export async function getContracts() {
  const json = await apiFetch("/api/admin/contracts");
  // backend kita bungkus { data: paginator }
  return json.data;
}

export async function createContract(payload: {
  organization_id: number;
  contract_number: string;
  start_date: string;
  end_date: string;
  status?: "active" | "expired" | "terminated";
  reminder_days_before_end?: number;
  notes?: string | null;
}) {
  return apiFetch("/api/admin/contracts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteContract(id: number) {
  return apiFetch(`/api/admin/contracts/${id}`, { method: "DELETE" });
}
