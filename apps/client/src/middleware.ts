import { NextRequest, NextResponse } from "next/server";

const publicRoutes = ["/", "/login", "/register", "/unauthorized"];

/**
 * Normalize role string:
 * - trim
 * - lowercase
 * - convert spaces/dashes to underscore
 */
function normalizeRole(v: any): string | null {
  if (!v) return null;

  // if role object: {name} / {slug}
  const raw =
    typeof v === "string"
      ? v
      : (v?.name ?? v?.slug ?? v?.role ?? v?.master_role ?? null);

  if (!raw) return null;

  return String(raw).trim().toLowerCase().replace(/[\s-]+/g, "_");
}

/**
 * Expand alias supaya superadmin/super_admin dianggap setara.
 */
function expandAliases(roles: string[]): string[] {
  const set = new Set(roles);

  if (set.has("superadmin")) set.add("super_admin");
  if (set.has("super_admin")) set.add("superadmin");

  // kalau suatu saat ada "admin" yang harus setara dengan superadmin, uncomment:
  // if (set.has("superadmin") || set.has("super_admin")) set.add("admin");

  return Array.from(set);
}

// ⚠️ SESUAI master_roles kamu: superadmin | viriyastaff | custstaff
// Tambahkan variasi yang sering muncul: super_admin / admin
const roleRoutes: Record<string, string[]> = {
  "/admin": ["superadmin", "super_admin", "admin", "viriyastaff"],
  "/engineers": ["superadmin", "super_admin", "admin", "viriyastaff"],
  "/engineer": ["superadmin", "super_admin", "admin", "viriyastaff"],
  "/portal": ["custstaff", "viriyastaff", "superadmin", "super_admin", "admin"],
  "/profile": ["custstaff", "viriyastaff", "superadmin", "super_admin", "admin"],
};

function apiBase() {
  // Edge middleware kadang tidak dapat env dari cPanel kalau build-nya tidak bener,
  // jadi fallback ke domain API production (BUKAN localhost).
  const v =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "https://api.kosalla.viriyadb.com";
  return v.replace(/\/$/, "");
}

async function fetchMeWithToken(token: string) {
  const url = `${apiBase()}/api/auth/me`;
  return fetch(url, {
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });
}

function extractUserRoles(meJson: any): string[] {
  const u = meJson?.user ?? meJson ?? {};

  // master role bisa string, bisa object (relasi), bisa beda key
  const masterRole =
    normalizeRole(u?.master_role) ||
    normalizeRole(u?.role) ||
    normalizeRole(meJson?.master_role) ||
    normalizeRole(meJson?.role) ||
    normalizeRole(u?.masterRole) ||
    null;

  // spatie roles bisa array string / array object
  const rolesRaw = u?.roles ?? meJson?.roles ?? [];
  const spatieRoles = Array.isArray(rolesRaw)
    ? rolesRaw
        .map((r) => normalizeRole(r))
        .filter(Boolean) as string[]
    : [];

  const merged = Array.from(new Set([...(spatieRoles || []), ...(masterRole ? [masterRole] : [])]));
  return expandAliases(merged);
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
  const token = req.cookies.get("kosalla_token")?.value;

  console.log(`🍪 [MW] Accessing: ${pathname} | Token exists?`, Boolean(token));

  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // validasi token (JANGAN BIARKAN ERROR LEMPAR 500)
  let meRes: Response;
  try {
    meRes = await fetchMeWithToken(token);
  } catch (e) {
    console.log("❌ [MW] fetch /me FAILED:", String(e));
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete("kosalla_token");
    return res;
  }

  console.log("🤷‍♂️ [MW] fetch /me status:", meRes.status);

  if (!meRes.ok) {
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete("kosalla_token");
    return res;
  }

  const meJson = await meRes.json().catch(() => null);
  const userRoles = extractUserRoles(meJson);

  // role check untuk route yang match (sort biar route paling panjang diprioritaskan)
  const matchedRoute = Object.keys(roleRoutes)
    .sort((a, b) => b.length - a.length)
    .find((r) => pathname.startsWith(r));

  if (matchedRoute) {
    const allowed = roleRoutes[matchedRoute].map((r) => normalizeRole(r)).filter(Boolean) as string[];
    const allowedSet = new Set(expandAliases(allowed));
    const ok = userRoles.some((r) => allowedSet.has(r));

    console.log("🔐 [MW] route:", matchedRoute, "| roles:", userRoles, "| allowed:", Array.from(allowedSet), "| ok:", ok);

    if (!ok) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
