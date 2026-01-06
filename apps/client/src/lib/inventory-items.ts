const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type InventoryItem = {
  id: number;
  organization_id: number;
  name: string;
  product_type: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
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

export async function getInventoryItemsByOrg(orgId: number) {
  return apiFetch(`/api/admin/organizations/${orgId}/inventory-items`);
}

export async function createInventoryItem(orgId: number, payload: {
  name: string;
  product_type: string;
  is_active?: boolean;
}) {
  return apiFetch(`/api/admin/organizations/${orgId}/inventory-items`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateInventoryItem(id: number, payload: Partial<{
  name: string;
  product_type: string;
  is_active: boolean;
}>) {
  return apiFetch(`/api/admin/inventory-items/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteInventoryItem(id: number) {
  return apiFetch(`/api/admin/inventory-items/${id}`, { method: "DELETE" });
}
