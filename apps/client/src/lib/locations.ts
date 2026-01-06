const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type Location = {
  id: number;
  organization_id: number;
  name: string;
  address?: string | null;
  is_active?: boolean;
};

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("kosalla_token");
}

async function apiFetch(path: string, init: RequestInit = {}) {
  const token = getToken();
  if (!token) throw new Error("Unauthenticated");

  const url = `${API_URL}${path}`;
  const method = init.method ?? "GET";

  console.log("🌐 [LOC API] request", { url, method });

  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);

  console.log("📥 [LOC API] response", { url, status: res.status, data });

  if (!res.ok) throw new Error(data?.message ?? `Request failed (${res.status})`);
  return data;
}

// LIST (nested)
export async function getLocations(orgId: number) {
  const json = await apiFetch(`/api/admin/organizations/${orgId}/locations`);
  return json.data ?? json; // jaga-jaga kalau formatnya beda
}

// CREATE (nested)
export async function createLocation(
  orgId: number,
  payload: { name: string; address?: string | null; is_active?: boolean }
) {
  return apiFetch(`/api/admin/organizations/${orgId}/locations`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// UPDATE (shallow)
export async function updateLocation(
  id: number,
  payload: { name?: string; address?: string | null; is_active?: boolean }
) {
  return apiFetch(`/api/admin/locations/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// DELETE (shallow)
export async function deleteLocation(id: number) {
  return apiFetch(`/api/admin/locations/${id}`, {
    method: "DELETE",
  });
}
