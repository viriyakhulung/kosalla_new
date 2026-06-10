// apps/client/src/app/portal/manage/layout.tsx
import React from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

type SessionResponse = {
  ok?: boolean;
  role?: string | null;
  me?: any;
};

function isStaffFromSession(session: SessionResponse): boolean {
  const role = String(session?.role ?? "").toLowerCase();

  const roleIdRaw =
    session?.me?.user?.master_role_id ??
    session?.me?.master_role_id ??
    null;

  const roleId = roleIdRaw == null ? null : Number(roleIdRaw);

  const masterRole = String(
    session?.me?.user?.master_role ??
      session?.me?.master_role ??
      session?.me?.user?.role ??
      session?.me?.role ??
      role
  ).toLowerCase();

  return roleId === 2 || role === "viriyastaff" || masterRole === "viriyastaff";
}

export default async function PortalManageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  if (!cookieHeader) redirect("/login");

const h = await headers();

const hostRaw = h.get("x-forwarded-host") ?? h.get("host") ?? "";
const protoRaw =
  h.get("x-forwarded-proto") ??
  (process.env.NODE_ENV === "development" ? "http" : "https");

// ambil nilai pertama kalau header berisi "https, https"
const host = hostRaw.split(",")[0].trim();
const proto = protoRaw.split(",")[0].trim();

if (!host) redirect("/login");

const origin = `${proto}://${host}`;

  const res = await fetch(`${origin}/api/session`, {
    method: "POST",
    headers: {
      Cookie: cookieHeader,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (res.status === 401) redirect("/login");
  if (!res.ok) redirect("/login");

  const session: SessionResponse = await res.json();
  if (session?.ok === false) redirect("/login");

  // admin jangan masuk portal
  const r = String(session?.role ?? "").toLowerCase();
  if (r === "admin" || r === "super_admin" || r === "superadmin") {
    redirect("/admin");
  }

  // ✅ role gate: hanya staff
  if (!isStaffFromSession(session)) {
    redirect("/portal");
  }

  return <div className="min-h-screen">{children}</div>;
}