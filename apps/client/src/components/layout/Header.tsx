"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { User } from "@/types";
import { logout } from "@/lib/auth";

interface HeaderProps {
  user: User;
  onMenuToggle: () => void;
}

export function Header({ user, onMenuToggle }: HeaderProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-slate-200 px-6 py-4 flex justify-between items-center">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
          aria-label="Toggle menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>

      {/* Right Section - User Info */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:block text-right">
          <p className="text-sm font-semibold text-slate-900">{user.name}</p>
          <p className="text-xs text-slate-500">
            {user.roles?.[0] || "User"}
          </p>
        </div>

        {/* User Menu Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center font-semibold hover:bg-amber-600 transition-colors"
          >
            {user.name?.charAt(0).toUpperCase()}
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-50">
              <div className="p-3 border-b border-slate-200">
                <p className="text-sm font-semibold text-slate-900">
                  {user.name}
                </p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>

              <nav className="p-2 space-y-1">
                <a
                  href="/profile"
                  className="block px-3 py-2 text-sm hover:bg-slate-100 rounded transition-colors"
                  onClick={() => setShowUserMenu(false)}
                >
                  👤 Profile
                </a>
                <a
                  href="/settings"
                  className="block px-3 py-2 text-sm hover:bg-slate-100 rounded transition-colors"
                  onClick={() => setShowUserMenu(false)}
                >
                  ⚙️ Settings
                </a>
              </nav>

              <div className="p-2 border-t border-slate-200">
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full px-3 py-2 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 transition-colors"
                >
                  {isLoggingOut ? "Logging out..." : "🚪 Logout"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
