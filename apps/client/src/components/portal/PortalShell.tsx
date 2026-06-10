"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Ticket,
  PlusCircle,
  BookOpen,
  User,
  Menu,
  X,
  LogOut,
  ChevronUp,
  PanelLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/lib/auth";
import { ViriyaLogo } from "@/components/ViriyaLogo";

const COLLAPSE_KEY = "kosalla_portal_sidebar_collapsed";

interface NavItem {
  label: string;
  href: string;
  staffHref?: string;
  icon: React.ElementType;
  exact?: boolean;
  hideForStaff?: boolean;
}

const PORTAL_SECTIONS: Array<{ section: string; items: NavItem[] }> = [
  {
    section: "PORTAL",
    items: [
      { label: "Dashboard", href: "/portal", icon: LayoutDashboard, exact: true },
      { label: "Tickets", href: "/portal/tickets", icon: Ticket },
      {
        label: "Create Ticket",
        href: "/portal/tickets/new",
        icon: PlusCircle,
        hideForStaff: true,
      },
      {
        label: "Knowledge Base",
        href: "/portal/tutorial",
        staffHref: "/portal/manage/tutorial",
        icon: BookOpen,
      },
    ],
  },
  {
    section: "ACCOUNT",
    items: [{ label: "Profile", href: "/portal/profile", icon: User }],
  },
];

function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "U"
  );
}

function getPageInfo(pathname: string): { breadcrumb: string; title: string } {
  if (pathname === "/portal") return { breadcrumb: "Portal", title: "Dashboard" };
  if (pathname === "/portal/tickets") return { breadcrumb: "Portal", title: "Ticket History" };
  if (pathname.startsWith("/portal/tickets/new")) return { breadcrumb: "Portal / Tickets", title: "Create a New Ticket" };
  if (/^\/portal\/tickets\/\d+/.test(pathname)) return { breadcrumb: "Portal / Ticket History", title: "Ticket Detail" };
  if (pathname === "/portal/profile") return { breadcrumb: "Portal", title: "Profile" };
  if (pathname.startsWith("/portal/manage/tutorial")) return { breadcrumb: "Portal", title: "Knowledge Base" };
  if (pathname.startsWith("/portal/tutorial")) return { breadcrumb: "Portal", title: "Knowledge Base" };
  if (pathname.startsWith("/portal/manage")) return { breadcrumb: "Portal", title: "Manage" };
  return { breadcrumb: "Portal", title: "Portal" };
}

export interface PortalShellProps {
  userName: string;
  userEmail: string;
  isStaff: boolean;
  children: React.ReactNode;
}

export function PortalShell({
  userName,
  userEmail,
  isStaff,
  children,
}: PortalShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // restore + persist desktop collapse preference
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem(COLLAPSE_KEY) === "1") {
      setCollapsed(true);
    }
  }, []);
  function toggleCollapsed() {
    setCollapsed((c) => {
      const next = !c;
      if (typeof window !== "undefined") localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });
  }

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  };

  async function handleLogout() {
    setUserMenuOpen(false);
    await logout().catch(() => {});
    router.push("/login");
  }

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuOpen]);

  const { breadcrumb, title } = getPageInfo(pathname);
  const showCreateTicket =
    !isStaff &&
    !pathname.startsWith("/portal/tickets/new") &&
    !/^\/portal\/tickets\/\d+/.test(pathname);

  return (
    <div className="flex min-h-screen bg-[#f5f6f8]">
      {/* ---- Sidebar ---- */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-screen w-[230px] flex-col bg-white border-r border-slate-200",
          "transition-[transform,width] duration-300 lg:sticky lg:top-0 lg:translate-x-0",
          collapsed && "lg:w-[72px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand */}
        <div className={cn("border-b border-slate-100 px-5 py-5", collapsed && "lg:px-3")}>
          <div className="relative flex items-center justify-center">
            {/* full logo */}
            <span className={cn("block [&_img]:!h-12 [&_img]:!w-auto", collapsed && "lg:hidden")}>
              <ViriyaLogo size="md" />
            </span>
            {/* compact mark (collapsed, desktop only) */}
            <span
              className={cn(
                "hidden size-9 items-center justify-center rounded-lg bg-teal-600 text-base font-extrabold text-white",
                collapsed && "lg:flex"
              )}
            >
              K
            </span>
            <button
              className="absolute right-0 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden"
              onClick={() => setMobileOpen(false)}
              aria-label="Tutup menu"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className={cn("mt-3 text-center", collapsed && "lg:hidden")}>
            <span className="block text-xl font-extrabold tracking-tight text-slate-900">
              Kosalla
            </span>
            <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.2em] text-teal-600">
              Ticketing &amp; KMS
            </span>
          </div>
        </div>

        {/* Nav — scrollable, takes remaining space */}
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
          {PORTAL_SECTIONS.map((section) => (
            <div key={section.section}>
              <p
                className={cn(
                  "px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400",
                  collapsed && "lg:hidden"
                )}
              >
                {section.section}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  if (item.hideForStaff && isStaff) return null;
                  const href =
                    item.staffHref && isStaff ? item.staffHref : item.href;
                  const active =
                    isActive(item.href, item.exact) ||
                    (item.staffHref ? isActive(item.staffHref) : false);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        collapsed && "lg:justify-center lg:px-0",
                        active
                          ? "bg-teal-50 text-teal-700"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-[17px] shrink-0",
                          active
                            ? "text-teal-600"
                            : "text-slate-400 group-hover:text-slate-600"
                        )}
                      />
                      <span className={cn(collapsed && "lg:hidden")}>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User footer — always pinned at bottom */}
        <div ref={userMenuRef} className="relative border-t border-slate-100">
          {/* Popup card — appears above the footer when open */}
          {userMenuOpen && (
            <div
              className={cn(
                "absolute bottom-full left-2 right-2 mb-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg",
                collapsed && "lg:right-auto lg:w-56"
              )}
            >
              {/* User info block */}
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white">
                  {initials(userName)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{userName}</p>
                  <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    {isStaff ? "Viriya Staff" : "Customer Staff"}
                  </p>
                </div>
              </div>

              {/* Divider + Logout */}
              <div className="border-t border-slate-100 p-1.5">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  <LogOut className="size-4 text-slate-400" />
                  Keluar
                </button>
              </div>
            </div>
          )}

          {/* Footer trigger button */}
          <button
            className={cn(
              "flex w-full items-center gap-2 px-4 py-4 hover:bg-slate-50 transition-colors",
              collapsed && "lg:justify-center lg:px-0"
            )}
            onClick={() => setUserMenuOpen((v) => !v)}
            aria-label="User menu"
            title={collapsed ? userName : undefined}
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white">
              {initials(userName)}
            </div>
            <div className={cn("min-w-0 flex-1 text-left", collapsed && "lg:hidden")}>
              <p className="truncate text-sm font-semibold text-slate-900">{userName}</p>
              <p className="truncate text-xs text-slate-400">{userEmail}</p>
            </div>
            <ChevronUp
              className={cn(
                "size-4 shrink-0 text-slate-400 transition-transform duration-200",
                !userMenuOpen && "rotate-180",
                collapsed && "lg:hidden"
              )}
            />
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      {/* ---- Main area ---- */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
          <button
            className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Buka menu"
          >
            <Menu className="size-5" />
          </button>

          {/* desktop: collapse/expand sidebar */}
          <button
            className="hidden rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:inline-flex"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Buka sidebar" : "Tutup sidebar"}
            title={collapsed ? "Buka sidebar" : "Tutup sidebar"}
          >
            <PanelLeft className="size-5" />
          </button>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              {breadcrumb}
            </p>
            <h1 className="truncate text-base font-bold leading-tight text-slate-900">
              {title}
            </h1>
          </div>

          {showCreateTicket && (
            <button
              onClick={() => router.push("/portal/tickets/new")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700"
            >
              <span className="text-base font-bold leading-none">+</span>
              Create Ticket
            </button>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
