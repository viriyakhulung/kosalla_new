const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type Organization = {
  id: number;
  name: string;
  slug?: string | null;
  contact_email?: string | null;
  phone?: string | null;
  address?: string | null;
  is_active?: boolean;
};

function getToken() {
  // aman kalau dipanggil di browser
  if (typeof window === "undefined") return null;
  return localStorage.getItem("kosalla_token");
}

// --- FUNGSI UTAMA FETCH ---
async function apiFetch(path: string, init: RequestInit = {}) {
  const token = getToken();

  const url = `${API_URL}${path}`;
  const method = init.method ?? "GET";

  console.log("🌐 [ORG API] request", { url, method, hasToken: Boolean(token) });

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  // hanya set JSON content-type kalau ada body
  if (init.body) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, {
    ...init,
    headers: {
      ...headers,
      ...(init.headers as Record<string, string> | undefined),
    },
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);

  console.log("📥 [ORG API] response", { status: res.status, data });

  if (!res.ok) {
    throw new Error(data?.message ?? `Request failed (${res.status})`);
  }

  return data;
}

// --- ENDPOINTS ---

export async function getOrganizations(): Promise<Organization[]> {
  const json = await apiFetch("/api/admin/organizations");
  return json.data; // backend kamu return { data: [...] }
}

export async function createOrganization(payload: { name: string }) {
  return apiFetch("/api/admin/organizations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteOrganization(id: number) {
  return apiFetch(`/api/admin/organizations/${id}`, {
    method: "DELETE",
  });
}

export async function updateOrganization(id: number, payload: { name: string }) {
  return apiFetch(`/api/admin/organizations/${id}`, {
    method: "PUT", // kalau backend pakai PATCH, ganti jadi "PATCH"
    body: JSON.stringify(payload),
  });
}
