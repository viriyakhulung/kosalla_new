"use client";

import Link from "next/link";

export default function AdminPage() {
  const externalSetupItems = [
    { title: "👥 Users", description: "Add/Edit user accounts", href: "/admin/users", icon: "👥" },
    { title: "🏢 Organization", description: "Setup organization", href: "/admin/organizations", icon: "🏢" },
    { title: "📍 Location", description: "Setup location", href: "/admin/locations", icon: "📍" },
    { title: "📦 Inventory", description: "Setup product type", href: "/admin/product-types", icon: "📦" },
    { title: "📋 Contracts", description: "Setup contracts", href: "/admin/contracts", icon: "📋" },
  ];

  const internalSetupItems = [
    { title: "🔧 Engineers", description: "Add virya engineer", href: "/admin/engineers", icon: "🔧" },
    { title: "👨‍💼 Team Groups", description: "Setup team group", href: "/admin/team-groups", icon: "👨‍💼" },
    { title: "👤 Team Members", description: "Setup team member + role", href: "/admin/team-members", icon: "👤" },
  ];

  const MenuCard = ({ title, description, href, icon }: any) => (
    <Link
      href={href}
      className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 border-t-4 border-amber-500"
    >
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="text-slate-600 text-sm mt-2">{description}</p>
      <div className="mt-4 flex items-center text-amber-500 text-sm font-semibold">Go →</div>
    </Link>
  );

  return (
    <div className="space-y-10 p-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-600 mt-2">Manage Kosalla system from here.</p>
      </div>

      <section>
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">📤 Setup Eksternal</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {externalSetupItems.map((item) => (
            <MenuCard key={item.href} {...item} />
          ))}
        </div>
      </section>

      <hr className="border-slate-200" />

      <section>
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">⚙️ Setup Internal</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {internalSetupItems.map((item) => (
            <MenuCard key={item.href} {...item} />
          ))}
        </div>
      </section>
    </div>
  );
}
