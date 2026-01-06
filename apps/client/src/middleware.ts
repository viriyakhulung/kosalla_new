import { NextRequest, NextResponse } from "next/server";

const publicRoutes = ["/", "/login", "/register", "/unauthorized"];

// ⚠️ SESUAI master_roles kamu: superadmin | viriyastaff | custstaff
const roleRoutes: Record<string, string[]> = {
  "/admin": ["superadmin"],
  "/engineers": ["superadmin", "viriyastaff"],
  "/engineer": ["superadmin", "viriyastaff"],
  "/portal": ["custstaff", "viriyastaff", "superadmin"],
  "/profile": ["custstaff", "viriyastaff", "superadmin"],
};

async function fetchMeWithToken(token: string) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const url = `${apiUrl}/api/auth/me`;

  return fetch(url, {
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // skip assets
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // public route
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // token cookie wajib untuk route private
  const token = req.cookies.get("token")?.value;

  // 👇👇👇 [DEBUG LOG 1] Cek Token Cookie 👇👇👇
  console.log(`🍪 [MW] Accessing: ${pathname} | Token exists?`, Boolean(token));

  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // validasi token
  const meRes = await fetchMeWithToken(token);

  // 👇👇👇 [DEBUG LOG 2] Cek Respon Backend 👇👇👇
  console.log("🤷‍♂️ [MW] fetch /me status:", meRes.status);

  if (!meRes.ok) {
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete("token");
    return res;
  }

  // parse /me response
  const json = await meRes.json().catch(() => null);

  // ✅ ambil role dari master_role (string), bukan dari spatie
  const masterRole = json?.user?.master_role ?? null;

  // kalau suatu saat spatie dipakai lagi, ini tetap aman
  const roles = json?.user?.roles ?? [];

  const userRoles = Array.from(
    new Set([
      ...(Array.isArray(roles) ? roles : []),
      ...(masterRole ? [masterRole] : []),
    ])
  );

  // role check untuk route yang match
  const matchedRoute = Object.keys(roleRoutes).find((r) =>
    pathname.startsWith(r)
  );

  if (matchedRoute) {
    const allowedRoles = roleRoutes[matchedRoute];

    const ok = userRoles.some((r: string) => allowedRoles.includes(r));
    if (!ok) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};