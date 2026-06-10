"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/types";
import { me } from "@/lib/auth";
import { AuthGuard } from "@/components/AuthGuard";
import { AdminShell } from "@/components/admin/AdminShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    me()
      .then((res: any) => setUser(res?.user ?? res?.me?.user ?? res?.me ?? null))
      .catch(() => router.replace("/login?next=/admin"))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f6f8] text-slate-500">
        Loading...
      </div>
    );
  }

  // ✅ role backend kamu: superadmin (bukan "super-admin")
  // kita kasih beberapa alias biar aman
  return (
    <AuthGuard user={user} requiredRoles={["superadmin", "super_admin", "super-admin", "admin", "viriyastaff"]}>
      <AdminShell user={user}>{children}</AdminShell>
    </AuthGuard>
  );
}
