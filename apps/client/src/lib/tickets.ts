const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("kosalla_token");
}

async function apiFetch(path: string, init: RequestInit = {}) {
  const token = getToken();
  if (!token) throw new Error("Unauthenticated");

  const url = `${API_URL}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message ?? `Request failed (${res.status})`);
  return data;
}

export async function listPortalTickets() {
  return apiFetch("/api/portal/tickets");
}

export async function createPortalTicket(payload: {
  subject: string;
  description: string;
  priority?: "low" | "normal" | "high";
  action_number?: string | null;
  requested_resolution_date?: string | null; // YYYY-MM-DD
  expected_date?: string | null;
}) {
  return apiFetch("/api/portal/tickets", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
