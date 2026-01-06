"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Role, User } from "@/types";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRoles?: Role[];
  user?: User | null;
}

export function AuthGuard({ children, requiredRoles, user }: AuthGuardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  const userRoles = useMemo<string[]>(() => {
    if (!user) return [];
    const roles = Array.isArray((user as any).roles) ? (user as any).roles : [];
    const masterRole = (user as any).master_role;
    return Array.from(new Set([...roles, ...(masterRole ? [masterRole] : [])]));
  }, [user]);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }

    if (requiredRoles && requiredRoles.length > 0) {
      const ok = userRoles.some((r) => requiredRoles.includes(r as Role));
      if (!ok) {
        router.replace("/unauthorized");
        return;
      }
    }

    setAuthorized(true);
    setLoading(false);
  }, [user, requiredRoles, userRoles, router]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!authorized) return null;

  return <>{children}</>;
}
