"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem, Role } from "@/types";

interface SidebarProps {
  userRole: Role;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ userRole, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  // Menu items sesuai role
  const menuItems: NavItem[] = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: "📊",
      roles: ["super-admin", "engineer-manager", "engineer-staff", "enduser"],
    },
    {
      label: "Tickets",
      href: "/portal/tickets",
      icon: "🎫",
      roles: ["enduser"],
    },
    {
      label: "Create Ticket",
      href: "/portal/tickets/create",
      icon: "➕",
      roles: ["enduser"],
    },
    {
      label: "Admin",
      icon: "⚙️",
      href: "/admin",
      roles: ["super-admin"],
      children: [
        {
          label: "Users",
          href: "/admin/users",
          roles: ["super-admin"],
        },
        {
          label: "Organizations",
          href: "/admin/organizations",
          roles: ["super-admin"],
        },
        {
          label: "Locations",
          href: "/admin/locations",
          roles: ["super-admin"],
        },
        {
          label: "Contracts",
          href: "/admin/contracts",
          roles: ["super-admin"],
        },
      ],
    },
    {
      label: "Engineer",
      icon: "🔧",
      href: "/engineer",
      roles: ["engineer-manager", "engineer-staff"],
    },
    {
      label: "Profile",
      href: "/profile",
      icon: "👤",
      roles: ["super-admin", "engineer-manager", "engineer-staff", "enduser"],
    },
  ];

  // Filter menu berdasarkan role
  const filteredMenu = menuItems.filter((item) =>
    item.roles?.includes(userRole)
  );

  const isActive = (href: string) => pathname === href;

  return (
    <aside
      className={`${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0 fixed lg:relative w-64 h-screen bg-gradient-to-b from-primary/95 to-primary text-white transition-transform duration-300 z-40 overflow-y-auto border-r border-primary/50 dark:border-primary/30 dark:from-primary/80 dark:to-primary/70`}
    >
      {/* Logo Section */}
      <div className="p-6 border-b border-white/10 sticky top-0 bg-primary/98 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center font-bold text-lg">
            K
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Kosalla</h1>
            <p className="text-xs text-white/60">Ticketing System</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {filteredMenu.map((item) => (
          <div key={item.href}>
            <Link
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium ${
                isActive(item.href)
                  ? "bg-white/20 backdrop-blur-sm text-white shadow-lg scale-105"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-sm">{item.label}</span>
            </Link>

            {/* Sub menu */}
            {item.children && isActive(item.href) && (
              <div className="ml-4 mt-2 pl-2 border-l-2 border-white/20 space-y-1">
                {item.children.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    onClick={onClose}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                      isActive(child.href)
                        ? "bg-white/20 text-white"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span>{child.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer Info */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-gradient-to-t from-primary to-transparent">
        <p className="text-xs text-white/60 text-center">
          © 2025 Kosalla
        </p>
      </div>
    </aside>
  );
}
