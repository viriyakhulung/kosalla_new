import { NextRequest, NextResponse } from "next/server";

const publicRoutes = ["/", "/login", "/register", "/unauthorized"];

const roleRoutes: Record<string, string[]> = {
  "/admin": ["super-admin"],
  "/engineer": ["engineer-manager", "engineer-staff"],
  "/portal": ["enduser", "engineer-manager", "engineer-staff", "super-admin"],
  "/profile": ["super-admin", "engineer-manager", "engineer-staff", "enduser"],
};

async function fetchMe(req: NextRequest) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const url = `${apiUrl}/api/auth/me`;

  console.log("📡 [FETCH-ME] URL:", url);
  console.log("🍪 [FETCH-ME] Cookies sent:", req.headers.get("cookie"));

  try {
    const res = await fetch(url, {
      headers: {
        accept: "application/json",
        cookie: req.headers.get("cookie") ?? "",
      },
      credentials: "include",
      cache: "no-store",
    });

    console.log("📥 [FETCH-ME] Status:", res.status);
    console.log("📥 [FETCH-ME] Content-Type:", res.headers.get("content-type"));

    return res;
  } catch (err) {
    console.error("❌ [FETCH-ME] Network error:", err);
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  console.log("\n==============================================");
  console.log("🔍 [MIDDLEWARE] Path:", pathname);

  // 0️⃣ BYPASS API & SANCTUM
  if (pathname.startsWith("/api/") || pathname.startsWith("/sanctum/")) {
    console.log("⏭️ [SKIP] API / Sanctum request dilewati middleware");
    return NextResponse.next();
  }

  // 1️⃣ PUBLIC ROUTES
  if (publicRoutes.includes(pathname)) {
    console.log("✅ [PUBLIC] Route publik, lanjut");
    return NextResponse.next();
  }

  // 2️⃣ CHECK SESSION COOKIE
  const laravelSession = req.cookies.get("laravel_session")?.value;

  console.log(
    "🎫 [AUTH] laravel_session:",
    laravelSession ? "ADA" : "TIDAK ADA"
  );

  if (!laravelSession) {
    console.log("🚫 [AUTH] Tidak ada session → redirect /login");
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3️⃣ VALIDASI SESSION KE BACKEND
  const meRes = await fetchMe(req);

  if (!meRes || !meRes.ok) {
    console.log("❌ [AUTH] /me gagal atau tidak OK");
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 4️⃣ ROLE CHECK
  for (const [route, allowedRoles] of Object.entries(roleRoutes)) {
    if (pathname.startsWith(route)) {
      try {
        const json = await meRes.json();
        const roles = json?.user?.roles ?? [];

        console.log("👤 [ROLE] User roles:", roles);
        console.log("🔐 [ROLE] Allowed:", allowedRoles);

        const ok = roles.some((r: string) => allowedRoles.includes(r));
        if (!ok) {
          console.log("⛔ [ROLE] Akses ditolak");
          return NextResponse.redirect(new URL("/unauthorized", req.url));
        }

        console.log("🔓 [ROLE] Akses diizinkan");
      } catch (e) {
        console.error("❌ [ROLE] JSON parse error:", e);
        return NextResponse.redirect(new URL("/login", req.url));
      }
      break;
    }
  }

  console.log("🚀 [MIDDLEWARE] Lolos semua check");
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
