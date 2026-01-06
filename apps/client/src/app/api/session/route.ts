// app/api/session/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const COOKIE_NAME = "kosalla_token";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 hari

function pickRole(me: any): string | null {
  return (
    me?.role ||
    me?.user?.role ||
    me?.master_role ||
    me?.user?.master_role ||
    me?.roles?.[0]?.name ||
    me?.user?.roles?.[0]?.name ||
    null
  );
}

// POST:
// - kalau ada body.token => set cookie
// - kalau tidak ada token => dianggap "cek session" (return user/role jika bisa)
export async function POST(req: Request) {
  const cookieStore = await cookies();

  // coba baca body, kalau tidak ada body ya gapapa
  let body: any = null;
  try {
    body = await req.json();
  } catch {
    body = null;
  }

  const token = body?.token as string | undefined;

  // Mode 1: SET TOKEN
  if (token) {
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: MAX_AGE,
    });

    return NextResponse.json({ ok: true });
  }

  // Mode 2: CHECK SESSION
  const saved = cookieStore.get(COOKIE_NAME)?.value;
  if (!saved) {
    return NextResponse.json({ ok: false, message: "No session" }, { status: 401 });
  }

  // Optional (lebih bagus): validasi token ke backend "me"
  // Karena kita belum 100% tahu endpoint me kamu yang mana,
  // kita coba beberapa path umum. Kalau tidak ada satupun, minimal ok=true.
  const API =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.API_BASE_URL ||
    "http://localhost:8000";

  const mePaths = ["/api/me", "/api/user", "/api/auth/me"];

  for (const p of mePaths) {
    try {
      const r = await fetch(`${API}${p}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${saved}`,
        },
        cache: "no-store",
      });

      if (r.ok) {
        const me = await r.json();
        const role = pickRole(me);
        return NextResponse.json({ ok: true, role, me });
      }
    } catch {
      // ignore dan coba path lain
    }
  }

  // fallback: token ada tapi endpoint me tidak cocok / tidak tersedia
  return NextResponse.json({ ok: true, role: null });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return NextResponse.json({ ok: true });
}
