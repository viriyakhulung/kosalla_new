// src/lib/api.ts

const RAW =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://api.kosalla.viriyadb.com";

const BASE = RAW.replace(/\/$/, "");

// pastikan ada /api di ujung (tanpa double)
export const API_BASE = BASE.endsWith("/api") ? BASE : `${BASE}/api`;

/**
 * Ambil cookie dari browser (untuk fallback token).
 * Catatan: hanya bisa baca cookie NON-httpOnly.
 */
function getCookie(name: string) {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[2]) : null;
}

// Support 2 mode:
// - Cookie/session (Sanctum SPA) -> credentials include sudah cukup
// - Bearer token -> simpan di localStorage "kosalla_token"
// Fallback: kalau localStorage kosong, ambil dari cookie "kosalla_token"
function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("kosalla_token") || getCookie("kosalla_token");
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers = new Headers(options.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");

  // kalau body JSON dan belum set content-type
  if (options.body && !(options.body instanceof FormData)) {
    if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // ? bikin method selalu eksplisit (default GET)
  const method = String(options.method ?? "GET").toUpperCase();
  const url = `${API_BASE}${path}`;

  // =========================
  // ? DEBUG: deteksi GET nyasar ke /published + stacktrace
  // (kalau sudah ketemu sumbernya, kamu bisa hapus blok ini)
  // =========================
  if (method === "GET" && /\/published(\?|$)/.test(path)) {
    console.warn("[apiFetch] ? GET to /published detected:", url);
    console.warn("[apiFetch] stack:", new Error("trace").stack);
  }
  // =========================

  const res = await fetch(url, {
    ...options,
    method, // ? override biar konsisten
    headers,
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      msg = data?.message ?? msg;
    } catch {}
    throw new Error(msg);
  }

  // kalau response 204, jangan json()
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const token = getToken();

  const headers = new Headers();
  headers.set("Accept", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const url = `${API_BASE}${path}`;

  const res = await fetch(url, {
    method: "POST",
    body: formData,
    headers,
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      msg = data?.message ?? msg;
    } catch {}
    throw new Error(msg);
  }

  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

// untuk download via fetch (kalau Bearer token)
export async function downloadWithAuth(url: string, filename?: string) {
  const token = getToken();

  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    credentials: "include",
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Download gagal: ${res.status}`);

  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename ?? "file";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(blobUrl);
}