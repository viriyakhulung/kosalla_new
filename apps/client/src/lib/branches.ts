// Lib CRUD cabang (anak-org). Jiplak pola lib/locations.ts.
// Endpoint admin:
//   GET    /api/admin/organizations/{org}/branches
//   POST   /api/admin/organizations/{org}/branches
//   PUT    /api/admin/branches/{branch}      (shallow)
//   DELETE /api/admin/branches/{branch}       (shallow)

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api.kosalla.viriyadb.com";

export type BranchStatus = "active" | "inactive";

export type Branch = {
  id: number;
  organization_id: number;
  name: string;
  code?: string | null;
  address?: string | null;
  status: BranchStatus;
  locations_count?: number;
};

export type BranchPayload = {
  name?: string;
  code?: string | null;
  address?: string | null;
  status?: BranchStatus;
};

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
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message ?? `Request failed (${res.status})`);
  return data;
}

// LIST (nested per org)
export async function listBranches(orgId: number): Promise<Branch[]> {
  const json = await apiFetch(`/api/admin/organizations/${orgId}/branches`);
  return json.data ?? json;
}

// CREATE (nested)
export async function createBranch(orgId: number, payload: BranchPayload) {
  return apiFetch(`/api/admin/organizations/${orgId}/branches`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// UPDATE (shallow)
export async function updateBranch(branchId: number, payload: BranchPayload) {
  return apiFetch(`/api/admin/branches/${branchId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// DELETE (shallow)
export async function deleteBranch(branchId: number) {
  return apiFetch(`/api/admin/branches/${branchId}`, {
    method: "DELETE",
  });
}
