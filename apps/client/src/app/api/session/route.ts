// app/api/session/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const COOKIE_NAME = "kosalla_token";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 hari

function asObj(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

function pickRole(me: unknown): string | null {
  const o = asObj(me);
  if (!o) return null;

  const direct =
    (typeof o["role"] === "string" && o["role"]) ||
    (typeof o["master_role"] === "string" && o["master_role"]);
  if (direct) return direct;

  const user = asObj(o["user"]);
  if (user) {
    const uRole =
      (typeof user["role"] === "string" && user["role"]) ||
      (typeof user["master_role"] === "string" && user["master_role"]);
    if (uRole) return uRole;

    const roles = user["roles"];
    if (Array.isArray(roles) && roles.length > 0) {
      const r0 = asObj(roles[0]);
      const name = r0 && typeof r0["name"] === "string" ? (r0["name"] as string) : null;
      if (name) return name;
    }
  }

  const roles = o["roles"];
  if (Array.isArray(roles) && roles.length > 0) {
    const r0 = asObj(roles[0]);
    const name = r0 && typeof r0["name"] === "string" ? (r0["name"] as string) : null;
    if (name) return name;
  }

  return null;
}

function pickRoleId(me: unknown): number | null {
  const o = asObj(me);
  if (!o) return null;

  const direct = o["master_role_id"];
  if (typeof direct === "number") return direct;
  if (typeof direct === "string" && direct.trim() !== "" && !Number.isNaN(Number(direct))) return Number(direct);

  const user = asObj(o["user"]);
  if (user) {
    const u = user["master_role_id"];
    if (typeof u === "number") return u;
    if (typeof u === "string" && u.trim() !== "" && !Number.isNaN(Number(u))) return Number(u);
  }

  return null;
}

function apiBase(): string {
  const raw =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_BASE_URL ||
    "https://api.kosalla.viriyadb.com";

  return raw.replace(/\/$/, "");
}

function apiWithApiSuffix(): string {
  const base = apiBase();
  return base.endsWith("/api") ? base : `${base}/api`;
}

async function verifyToken(token: string) {
  const API = apiWithApiSuffix();
  const r = await fetch(`${API}/auth/me`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!r.ok) return null;
  return r.json();
}

function clearCookieResponse(status = 401, message = "Invalid session") {
  const res = NextResponse.json({ ok: false, message }, { status });
  res.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}

// ✅ GET: cek session
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ ok: false, message: "No session" }, { status: 401 });
  }

  try {
    const me = (await verifyToken(token)) as unknown;
    if (!me) return clearCookieResponse(401, "Invalid session");

    const role = pickRole(me);
    const role_id = pickRoleId(me);

    return NextResponse.json({ ok: true, role, role_id, me });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to reach backend";
    return NextResponse.json({ ok: false, message: msg }, { status: 500 });
  }
}

// ✅ POST:
// - kalau ada token => set cookie
// - kalau tidak ada token => fallback check session
export async function POST(req: Request) {
  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    body = null;
  }

  const b = asObj(body);
  const token = b?.["token"];

  if (typeof token === "string" && token.length > 0) {
    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: MAX_AGE,
    });
    return res;
  }

  return GET();
}

// ✅ DELETE: logout / clear cookie
export async function DELETE() {
  return clearCookieResponse(200, "OK");
} 