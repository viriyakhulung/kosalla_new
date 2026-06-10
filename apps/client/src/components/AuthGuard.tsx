"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Role, User } from "@/types";

interface AuthGuardProps {
  children: React.ReactNode;
  // biar aman: bisa Role[] atau string[] (kadang ada "super-admin")
  requiredRoles?: (Role | string)[];
  user?: User | null;
}

function norm(v: any): string | null {
  if (!v) return null;

  // string => lower + ganti "-" / spasi jadi "_"
  if (typeof v === "string") {
    return v.trim().toLowerCase().replace(/[\s-]+/g, "_");
  }

  // object role => ambil name/slug
  const raw = v?.name ?? v?.slug ?? v?.role ?? v?.master_role ?? null;
  if (!raw) return null;
  return String(raw).trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function expandAliases(list: string[]) {
  const set = new Set(list);

  // alias superadmin
  if (set.has("superadmin")) set.add("super_admin");
  if (set.has("super_admin")) set.add("superadmin");

  return Array.from(set);
}

export function AuthGuard({ children, requiredRoles, user }: AuthGuardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  const userRoles = useMemo<string[]>(() => {
    if (!user) return [];

    const rolesArr = Array.isArray((user as any).roles) ? (user as any).roles : [];
    const roles = rolesArr
      .map((r: any) => norm(r))
      .filter(Boolean) as string[];

    // master_role bisa string atau object {id,name}
    const masterRole =
      norm((user as any).master_role) ||
      norm((user as any).masterRole) ||
      norm((user as any).master_role?.name) ||
      null;

    const all = [...roles, ...(masterRole ? [masterRole] : [])];
    return expandAliases(Array.from(new Set(all)));
  }, [user]);

  const required = useMemo<string[] | null>(() => {
    if (!requiredRoles || requiredRoles.length === 0) return null;
    const rr = requiredRoles.map((r) => norm(r)).filter(Boolean) as string[];
    return expandAliases(Array.from(new Set(rr)));
  }, [requiredRoles]);

  useEffect(() => {
    // reset state setiap kali berubah
    setAuthorized(false);
    setLoading(true);

    if (!user) {
      router.replace("/login");
      setLoading(false);
      return;
    }

    if (required && required.length > 0) {
      const ok = userRoles.some((r) => required.includes(r));
      if (!ok) {
        router.replace("/unauthorized");
        setLoading(false);
        return;
      }
    }

    setAuthorized(true);
    setLoading(false);
  }, [user, required, userRoles, router]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!authorized) return null;

  return <>{children}</>;
}
