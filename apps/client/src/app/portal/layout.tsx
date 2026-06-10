// app/portal/layout.tsx
import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PortalShell } from "@/components/portal/PortalShell";
import PortalPopupsClient from "./PortalPopupsClient";

function asObj(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

function pickName(me: unknown): string | null {
  const o = asObj(me);
  if (!o) return null;

  const direct =
    (typeof o["name"] === "string" && o["name"]) ||
    (typeof o["full_name"] === "string" && o["full_name"]);
  if (direct) return direct;

  const user = asObj(o["user"]);
  if (user) {
    const uName =
      (typeof user["name"] === "string" && user["name"]) ||
      (typeof user["full_name"] === "string" && user["full_name"]);
    if (uName) return uName;
  }

  return null;
}

function pickRoleName(me: unknown): string | null {
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

function pickEmail(me: unknown): string | null {
  const o = asObj(me);
  if (!o) return null;

  const direct = typeof o["email"] === "string" && o["email"] ? o["email"] : null;
  if (direct) return direct;

  const user = asObj(o["user"]);
  if (user) {
    const uEmail = typeof user["email"] === "string" && user["email"] ? user["email"] : null;
    if (uEmail) return uEmail;
  }

  return null;
}

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();

  const token = cookieStore.get("kosalla_token")?.value;
  if (!token) redirect("/login?next=%2Fportal");

  const API = (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.API_BASE_URL ||
    "https://api.kosalla.viriyadb.com"
  ).replace(/\/$/, "");

  const meRes = await fetch(`${API}/api/auth/me`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (meRes.status === 401) redirect("/login?next=%2Fportal");
  if (!meRes.ok) redirect("/login?next=%2Fportal");

  const me = (await meRes.json().catch(() => ({}))) as unknown;

  const roleName = pickRoleName(me);
  const roleId = pickRoleId(me);

  // Admins go to admin console
  if (roleId === 1 || roleName === "admin" || roleName === "super_admin" || roleName === "superadmin") {
    redirect("/admin");
  }

  const userName = pickName(me) ?? "User";
  const userEmail = pickEmail(me) ?? "";
  const isStaff = roleId === 2 || String(roleName ?? "").toLowerCase() === "viriyastaff";

  // Popups only for customers (master_role_id = 3 / custstaff)
  const allowPopups = roleId === 3 || String(roleName ?? "").toLowerCase() === "custstaff";

  return (
    <PortalShell userName={userName} userEmail={userEmail} isStaff={isStaff}>
      <PortalPopupsClient enabled={allowPopups} />
      {children}
    </PortalShell>
  );
}
