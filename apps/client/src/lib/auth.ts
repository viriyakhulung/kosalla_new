const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type LoginResponse = {
  token: string;
  user: any;
};

function setTokenClient(token: string) {
  // localStorage buat client fetch
  localStorage.setItem("kosalla_token", token);
}

function clearTokenClient() {
  localStorage.removeItem("kosalla_token");
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password, device_name: "web" }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) throw new Error(data?.message || `Login failed (${res.status})`);
  if (!data?.token) throw new Error("Login response missing token");

  // simpan token utk client
  setTokenClient(data.token);

  // ✅ set cookie token via Next.js server route (anti race-condition)
  const cookieRes = await fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ token: data.token }),
  });

  if (!cookieRes.ok) throw new Error("Failed to set session cookie");

  return data;
}

export async function me() {
  const token = localStorage.getItem("kosalla_token");
  if (!token) throw new Error("Unauthenticated");

  const res = await fetch(`${API_URL}/api/auth/me`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    clearTokenClient();
    // juga hapus cookie token
    await fetch("/api/session", { method: "DELETE" }).catch(() => {});
    throw new Error(data?.message || `Me failed (${res.status})`);
  }

  return data;
}

export async function logout() {
  const token = localStorage.getItem("kosalla_token");

  if (token) {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    }).catch(() => {});
  }

  clearTokenClient();
  await fetch("/api/session", { method: "DELETE",credentials:"include" }).catch(() => {});
}
