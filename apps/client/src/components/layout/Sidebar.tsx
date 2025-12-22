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
      } lg:translate-x-0 fixed lg:relative w-64 h-screen bg-slate-900 text-white transition-transform duration-300 z-40 overflow-y-auto`}
    >
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-2xl font-bold text-amber-500">Kosalla</h1>
      </div>

      <nav className="p-4 space-y-2">
        {filteredMenu.map((item) => (
          <div key={item.href}>
            <Link
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                isActive(item.href)
                  ? "bg-amber-600 text-white"
                  : "hover:bg-slate-800 text-slate-300"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>

            {/* Sub menu */}
            {item.children && isActive(item.href) && (
              <div className="ml-8 space-y-1 mt-2">
                {item.children.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    onClick={onClose}
                    className={`flex items-center gap-2 px-3 py-1 rounded text-sm transition-colors ${
                      isActive(child.href)
                        ? "bg-amber-600 text-white"
                        : "hover:bg-slate-800 text-slate-400"
                    }`}
                  >
                    <span>→</span>
                    <span>{child.label}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}
