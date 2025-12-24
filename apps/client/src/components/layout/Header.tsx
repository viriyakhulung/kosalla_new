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
    <header className="bg-white dark:bg-slate-900 border-b border-border dark:border-border/50 px-6 py-4 flex justify-between items-center shadow-sm dark:shadow-lg">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors duration-200"
          aria-label="Toggle menu"
        >
          <svg
            className="w-6 h-6 text-foreground"
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

        {/* Logo/Branding */}
        <div className="hidden sm:flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center text-white font-bold text-sm">
            K
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Kosalla
          </h1>
        </div>
      </div>

      {/* Right Section - User Info */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:block text-right">
          <p className="text-sm font-semibold text-foreground">{user.name}</p>
          <p className="text-xs text-muted-foreground capitalize">
            {user.roles?.[0]?.replace(/-/g, " ") || "User"}
          </p>
        </div>

        {/* User Menu Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 border-2 border-primary/20 dark:border-primary/40"
          >
            {user.name?.charAt(0).toUpperCase()}
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-border dark:border-border/50 z-50 overflow-hidden">
              {/* User Info Section */}
              <div className="p-4 border-b border-border dark:border-border/50 bg-slate-50 dark:bg-slate-800/50">
                <p className="text-sm font-semibold text-foreground">
                  {user.name}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{user.email}</p>
              </div>

              {/* Menu Items */}
              <nav className="p-2 space-y-1">
                <a
                  href="/profile"
                  className="flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-primary/10 dark:hover:bg-primary/10 rounded-lg transition-colors duration-200 text-foreground hover:text-primary font-medium group"
                  onClick={() => setShowUserMenu(false)}
                >
                  <svg className="w-4 h-4 text-muted-foreground group-hover:text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profile
                </a>
                <a
                  href="/settings"
                  className="flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-primary/10 dark:hover:bg-primary/10 rounded-lg transition-colors duration-200 text-foreground hover:text-primary font-medium group"
                  onClick={() => setShowUserMenu(false)}
                >
                  <svg className="w-4 h-4 text-muted-foreground group-hover:text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Settings
                </a>
              </nav>

              {/* Logout Button */}
              <div className="p-2 border-t border-border dark:border-border/50 bg-slate-50 dark:bg-slate-800/50">
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full px-3 py-2.5 text-sm bg-destructive/10 text-destructive hover:bg-destructive/20 dark:hover:bg-destructive/30 rounded-lg disabled:opacity-50 transition-colors duration-200 font-semibold flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  {isLoggingOut ? "Signing out..." : "Sign Out"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
