"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Role, User } from "@/types";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRoles?: Role[];
  user?: User;
}

export function AuthGuard({
  children,
  requiredRoles,
  user,
}: AuthGuardProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Jika tidak ada user
    if (!user) {
      router.push("/login");
      return;
    }

    // 2. Jika ada requiredRoles, check apakah user punya role
    if (requiredRoles && requiredRoles.length > 0) {
      const hasRole = user.roles.some((role) =>
        requiredRoles.includes(role as Role)
      );

      if (!hasRole) {
        router.push("/unauthorized");
        return;
      }
    }

    // 3. Authorized
    setIsAuthorized(true);
    setIsLoading(false);
  }, [user, requiredRoles, router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authorized
  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 font-semibold">Access Denied</p>
        </div>
      </div>
    );
  }

  // Authorized - render children
  return <>{children}</>;
}
