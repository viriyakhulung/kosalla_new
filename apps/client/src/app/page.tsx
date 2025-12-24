"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to portal by default (users will be redirected by middleware if unauthorized)
    router.replace("/portal");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-slate-50 to-teal-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      <div className="text-center space-y-6">
        {/* Loading Animation */}
        <div className="flex justify-center">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-full animate-pulse"></div>
            <div className="absolute inset-2 bg-white dark:bg-slate-950 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
          </div>
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Kosalla Ticketing System</h1>
          <p className="text-muted-foreground">Redirecting to your dashboard...</p>
        </div>

        {/* Fallback Message */}
        <div className="text-sm text-muted-foreground">
          <p>If you're not redirected in a few seconds, please</p>
          <a href="/portal" className="font-semibold text-primary hover:text-primary/80 transition-colors">
            click here
          </a>
        </div>
      </div>
    </div>
  );
}
