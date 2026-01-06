const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type ProductType = {
  id: number;
  organization_id: number;
  name: string;
  code: string;
  description?: string | null;
  is_active?: boolean;
};

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

  const res = await fetch(url, { ...init, headers, cache: "no-store" });
  const data = await res.json().catch(() => null);

  if (!res.ok) throw new Error(data?.message ?? `Request failed (${res.status})`);
  return data;
}

export async function getProductTypes(organizationId?: number): Promise<any> {
  const qs = organizationId ? `?organization_id=${organizationId}` : "";
  return apiFetch(`/api/admin/product-types${qs}`);
}

export async function createProductType(payload: {
  organization_id: number;
  name: string;
  code: string;
  description?: string;
  is_active?: boolean;
}) {
  return apiFetch("/api/admin/product-types", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateProductType(id: number, payload: Partial<{
  organization_id: number;
  name: string;
  code: string;
  description: string;
  is_active: boolean;
}>) {
  return apiFetch(`/api/admin/product-types/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteProductType(id: number) {
  return apiFetch(`/api/admin/product-types/${id}`, { method: "DELETE" });
}
