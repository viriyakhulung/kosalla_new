// app/portal/layout.tsx
import React from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

type SessionResponse = {
  ok?: boolean;
  role?: string | null;
  me?: any;
};

export default async function PortalLayout({
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
  const host = h.get("host"); // localhost:3000
  const proto =
    h.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "development" ? "http" : "https");

  if (!host) redirect("/login");
  const origin = `${proto}://${host}`;

  const res = await fetch(`${origin}/api/session`, {
    method: "POST", // ✅ biar match sama yang kamu lihat di Network
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

  // optional: kalau role admin jangan masuk portal
  if (session?.role === "admin" || session?.role === "super_admin" || session?.role === "superadmin") {
    redirect("/admin");
  }

  return <div className="min-h-screen">{children}</div>;
}
