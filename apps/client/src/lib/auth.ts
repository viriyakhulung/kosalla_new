const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type LoginResponse = {
  token?: string; // kalau kamu juga generate token
  user?: any;
};

export async function csrfCookie() {
  // Sanctum SPA: ini yang bikin cookie XSRF-TOKEN diset oleh Laravel
  const res = await fetch(`${API_URL}/sanctum/csrf-cookie`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(`CSRF cookie failed: ${res.status}`);
  }
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  await csrfCookie();

  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      device_name: "web", // optional (kalau controller kamu pakai)
    }),
  });

  // ✅ kalau backend tetap balas HTML, ini akan ketahuan:
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const text = await res.text();
    throw new Error(`Expected JSON, got: ${contentType}. Body starts: ${text.slice(0, 120)}`);
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.message || `Login failed: ${res.status}`);
  }

  return data;
}

export async function me() {
  const res = await fetch(`${API_URL}/api/auth/me`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Accept": "application/json",
    },
    cache: "no-store",
  });

  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const text = await res.text();
    throw new Error(`Expected JSON, got: ${contentType}. Body starts: ${text.slice(0, 120)}`);
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || `Me failed: ${res.status}`);
  return data;
}

export async function logout() {
  const res = await fetch(`${API_URL}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Accept": "application/json",
    },
  });

  if (!res.ok) throw new Error(`Logout failed: ${res.status}`);
}
