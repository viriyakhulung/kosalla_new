"use client";

import { useState } from "react";
import type { User, Role } from "@/types";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

interface MainLayoutProps {
  user: User;
  children: React.ReactNode;
}

export function MainLayout({ user, children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Ambil role pertama dari user, default ke "enduser"
  const userRole = (user.roles?.[0] as Role) ?? "enduser";

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex h-screen bg-background dark:bg-slate-950">
      {/* Sidebar */}
      <Sidebar
        userRole={userRole}
        isOpen={sidebarOpen}
        onClose={closeSidebar}
      />

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm lg:hidden z-30 transition-opacity duration-300"
          onClick={closeSidebar}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header user={user} onMenuToggle={toggleSidebar} />

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 via-background to-blue-50/30 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-t border-border dark:border-border/50 px-6 py-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 Kosalla Ticketing System. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
