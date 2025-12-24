import Link from "next/link";
import { AuthGuard } from "@/components/AuthGuard";
import { me } from "@/lib/auth";
import type { User } from "@/types";

async function getAdminData() {
  try {
    const response = await me();
    return response?.user;
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return null;
  }
}

export default async function AdminPage() {
  const user = await getAdminData();

  const externalSetupItems = [
    {
      title: "👥 Users",
      description: "Add/Edit user accounts",
      href: "/admin/users",
      icon: "👥",
    },
    {
      title: "🏢 Organization",
      description: "Setup organization",
      href: "/admin/organizations",
      icon: "🏢",
    },
    {
      title: "📍 Location",
      description: "Setup location",
      href: "/admin/locations",
      icon: "📍",
    },
    {
      title: "📦 Inventory",
      description: "Setup product type",
      href: "/admin/product-types",
      icon: "📦",
    },
    {
      title: "📋 Contracts",
      description: "Setup contracts",
      href: "/admin/contracts",
      icon: "📋",
    },
  ];

  const internalSetupItems = [
    {
      title: "🔧 Engineers",
      description: "Add virya engineer",
      href: "/admin/engineers",
      icon: "🔧",
    },
    {
      title: "👨‍💼 Team Groups",
      description: "Setup team group (DB, Apps, Integration, Infra)",
      href: "/admin/team-groups",
      icon: "👨‍💼",
    },
    {
      title: "👤 Team Members",
      description: "Setup team member + role",
      href: "/admin/team-members",
      icon: "👤",
    },
  ];

  const MenuCard = ({
    title,
    description,
    href,
    icon,
  }: {
    title: string;
    description: string;
    href: string;
    icon: string;
  }) => (
    <Link
      href={href}
      className="group relative bg-white dark:bg-slate-900 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-border dark:border-border/50 hover:border-primary/50 dark:hover:border-primary/50 overflow-hidden"
    >
      {/* Background gradient accent */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

      {/* Content */}
      <div className="relative z-10">
        <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300 origin-left">{icon}</div>
        <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors duration-300">{title}</h3>
        <p className="text-muted-foreground text-sm mt-2 leading-relaxed">{description}</p>

        {/* Arrow indicator */}
        <div className="mt-5 flex items-center text-primary text-sm font-semibold group-hover:translate-x-1 transition-transform duration-300">
          <span>Manage</span>
          <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );

  return (
    <AuthGuard user={user} requiredRoles={["super-admin"]}>
      <div className="space-y-12">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-baseline gap-2">
            <h1 className="text-4xl font-bold text-foreground">Admin Dashboard</h1>
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">Super Admin</span>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Welcome back, <span className="font-semibold text-foreground">{user?.name}</span>! Manage and configure all aspects of the Kosalla system.
          </p>
        </div>

        {/* External Setup Section */}
        <section className="space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="text-2xl">📤</div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">External Configuration</h2>
              </div>
            </div>
            <p className="text-muted-foreground text-sm ml-11">
              Configure user accounts, organizations, locations, inventory, and contracts for external clients
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {externalSetupItems.map((item) => (
              <MenuCard
                key={item.href}
                title={item.title}
                description={item.description}
                href={item.href}
                icon={item.icon}
              />
            ))}
          </div>
        </section>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>

        {/* Internal Setup Section */}
        <section className="space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="text-2xl">⚙️</div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Internal Configuration</h2>
              </div>
            </div>
            <p className="text-muted-foreground text-sm ml-11">
              Manage engineers, setup team groups, and assign team members with appropriate roles
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {internalSetupItems.map((item) => (
              <MenuCard
                key={item.href}
                title={item.title}
                description={item.description}
                href={item.href}
                icon={item.icon}
              />
            ))}
          </div>
        </section>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>

        {/* Ticketing Section */}
        <section className="space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="text-2xl">🎫</div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Ticketing System</h2>
              </div>
            </div>
            <p className="text-muted-foreground text-sm ml-11">
              Monitor, manage, and generate reports on all tickets in the system
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <MenuCard
              title="🎫 All Tickets"
              description="View, filter, and manage all support tickets"
              href="/admin/tickets"
              icon="🎫"
            />
            <MenuCard
              title="📊 Ticket Reports"
              description="View detailed statistics and performance reports"
              href="/admin/tickets/reports"
              icon="📊"
            />
          </div>
        </section>
      </div>
    </AuthGuard>
  );
}
