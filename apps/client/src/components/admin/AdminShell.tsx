"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, PanelLeft, Search, X } from "lucide-react";
import type { User } from "@/types";
import { cn } from "@/lib/utils";
import { logout } from "@/lib/auth";
import { ViriyaLogo } from "@/components/ViriyaLogo";
import { adminNav, titleFromPath } from "./admin-modules";

/* ---------- search shared between topbar (layout) and dashboard (page) ---------- */
type SearchState = { query: string; setQuery: (v: string) => void };
const SearchCtx = createContext<SearchState>({ query: "", setQuery: () => {} });
export const useAdminSearch = () => useContext(SearchCtx);

const COLLAPSE_KEY = "kosalla_admin_sidebar_collapsed";

/* ---------- helpers ---------- */
function getName(user?: User | null): string {
  const u = user as any;
  return u?.name || u?.full_name || u?.fullName || u?.email?.split("@")[0] || "Super Admin";
}

function getRoleLabel(user?: User | null): string {
  const u = user as any;
  const raw = u?.roles?.[0] ?? u?.role ?? null;
  const name = typeof raw === "string" ? raw : raw?.name ?? raw?.slug ?? null;
  if (!name) return "Viriya";
  return String(name)
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "SA";
}

export function AdminShell({ user, children }: { user: User | null; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

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

  const title = useMemo(() => titleFromPath(pathname), [pathname]);
  const name = getName(user);
  const role = getRoleLabel(user);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(href + "/");

  async function handleLogout() {
    await logout().catch(() => {});
    router.push("/login");
  }

  return (
    <SearchCtx.Provider value={{ query, setQuery }}>
      <div className={cn("min-h-screen bg-[#f5f6f8]", collapsed ? "lg:pl-[76px]" : "lg:pl-[260px]")}>
        {/* ---------------- Sidebar ---------------- */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-slate-200 bg-white text-slate-600",
            "transition-[transform,width] duration-300 lg:translate-x-0",
            collapsed && "lg:w-[76px]",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {/* brand */}
          <div className={cn("relative flex items-center justify-center border-b border-slate-100 px-5 pt-6 pb-5", collapsed && "lg:px-3")}>
            <Link href="/admin" className="block min-w-0" onClick={() => setMobileOpen(false)}>
              {/* full brand */}
              <span className={cn("block text-center", collapsed && "lg:hidden")}>
                <span className="block [&_img]:!h-12 [&_img]:!w-auto [&_img]:!mx-auto">
                  <ViriyaLogo size="md" />
                </span>
                <span className="mt-3 block text-xl font-extrabold tracking-tight text-slate-900">Kosalla</span>
                <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.22em] text-teal-600">
                  Admin Console
                </span>
              </span>
              {/* compact mark (collapsed, desktop only) */}
              <span
                className={cn(
                  "mx-auto hidden size-9 items-center justify-center rounded-lg bg-teal-600 text-base font-extrabold text-white",
                  collapsed && "lg:flex"
                )}
              >
                K
              </span>
            </Link>
            <button
              className="absolute right-4 top-6 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden"
              onClick={() => setMobileOpen(false)}
              aria-label="Tutup menu"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* nav */}
          <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-6">
            {adminNav.map((section) => (
              <div key={section.label}>
                <p
                  className={cn(
                    "px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400",
                    collapsed && "lg:hidden"
                  )}
                >
                  {section.label}
                </p>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const active = isActive(item.href);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
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
                            "size-[18px] shrink-0",
                            active ? "text-teal-600" : "text-slate-400 group-hover:text-slate-600"
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

          {/* user footer */}
          <div className={cn("flex items-center gap-3 border-t border-slate-100 px-4 py-4", collapsed && "lg:justify-center lg:px-0")}>
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white">
              {initials(name)}
            </div>
            <div className={cn("min-w-0", collapsed && "lg:hidden")}>
              <p className="truncate text-sm font-semibold text-slate-900">{name}</p>
              <p className="truncate text-xs text-teal-600">{role}</p>
            </div>
          </div>
        </aside>

        {/* mobile overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
        )}

        {/* ---------------- Topbar ---------------- */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
          {/* mobile: open drawer */}
          <button
            className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Buka menu"
          >
            <Menu className="size-5" />
          </button>
          {/* desktop: collapse/expand rail */}
          <button
            className="hidden rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:inline-flex"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Buka sidebar" : "Tutup sidebar"}
            title={collapsed ? "Buka sidebar" : "Tutup sidebar"}
          >
            <PanelLeft className="size-5" />
          </button>

          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Admin</p>
            <h1 className="truncate text-lg font-bold leading-tight text-slate-900">{title}</h1>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari modul..."
                className="h-9 w-44 rounded-lg border border-slate-200 bg-slate-50/60 pl-9 pr-3 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100 md:w-64"
              />
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* ---------------- Content ---------------- */}
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </SearchCtx.Provider>
  );
}
