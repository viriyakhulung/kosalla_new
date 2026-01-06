"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/types";
import { me } from "@/lib/auth";
import { AuthGuard } from "@/components/AuthGuard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    me()
      .then((res) => setUser(res.user))
      .catch(() => router.replace("/login?next=/admin"))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <AuthGuard user={user} requiredRoles={["super-admin"]}>
      {children}
    </AuthGuard>
  );
}
