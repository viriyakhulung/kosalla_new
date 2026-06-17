const RAW =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://api.kosalla.viriyadb.com";

const BASE = RAW.replace(/\/$/, "");
const API_BASE = BASE.endsWith("/api") ? BASE : `${BASE}/api`;

export type LoginResponse = {
  token: string;
  user: any;
};

function getTokenClient() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("kosalla_token");
}

function setTokenClient(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("kosalla_token", token);
}

function clearTokenClient() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("kosalla_token");
}

async function setSessionCookie(token: string) {
  const cookieRes = await fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    cache: "no-store",
    body: JSON.stringify({ token }),
  });

  if (!cookieRes.ok) throw new Error("Failed to set session cookie");
}

async function clearSessionCookie() {
  await fetch("/api/session", {
    method: "DELETE",
    credentials: "include",
    cache: "no-store",
  }).catch(() => {});
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    // device_name optional, tapi gapapa
    body: JSON.stringify({ email, password, device_name: "web" }),
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) throw new Error(data?.message || `Login failed (${res.status})`);
  if (!data?.token) throw new Error("Login response missing token");

  // 1) client (api.ts getToken())
  setTokenClient(data.token);

  // 2) server (layout.tsx cookies())
  await setSessionCookie(data.token);

  return data;
}

export async function me() {
  const token = getTokenClient();
  if (!token) throw new Error("Unauthenticated");

  const res = await fetch(`${API_BASE}/auth/me`, {
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
    await clearSessionCookie();
    throw new Error(data?.message || `Me failed (${res.status})`);
  }

  return data;
}

export async function logout() {
  const token = getTokenClient();

  if (token) {
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    }).catch(() => {});
  }

  clearTokenClient();
  await clearSessionCookie();
}

export type ProfileContact = {
  phone?: string | null;
  address_line?: string | null;
  city?: string | null;
  postal_code?: string | null;
};

export async function updateProfile(payload: ProfileContact) {
  const token = getTokenClient();
  if (!token) throw new Error("Unauthenticated");

  const res = await fetch(`${API_BASE}/auth/profile`, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const msg =
      data?.message ||
      data?.errors?.phone?.[0] ||
      data?.errors?.address_line?.[0] ||
      data?.errors?.city?.[0] ||
      data?.errors?.postal_code?.[0] ||
      `Update profil gagal (${res.status})`;
    throw new Error(msg);
  }

  // backend mengembalikan { user: {...} } (identik GET /auth/me)
  return data;
}

export async function changePassword(
  current_password: string,
  password: string,
  password_confirmation: string
) {
  const token = getTokenClient();
  if (!token) throw new Error("Unauthenticated");

  const res = await fetch(`${API_BASE}/auth/change-password`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ current_password, password, password_confirmation }),
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const msg =
      data?.message ||
      data?.errors?.current_password?.[0] ||
      data?.errors?.password?.[0] ||
      `Change password failed (${res.status})`;
    throw new Error(msg);
  }

  return data;
}
