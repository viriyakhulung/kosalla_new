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
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <Sidebar
        userRole={userRole}
        isOpen={sidebarOpen}
        onClose={closeSidebar}
      />

      {/* Overlay untuk mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-30"
          onClick={closeSidebar}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header user={user} onMenuToggle={toggleSidebar} />

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>

        {/* Footer (Optional) */}
        <footer className="bg-white border-t border-slate-200 px-6 py-4 text-center text-sm text-slate-500">
          <p>&copy; 2025 Kosalla. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
