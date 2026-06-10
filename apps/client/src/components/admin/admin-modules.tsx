import {
  LayoutDashboard,
  Users,
  Building2,
  MapPin,
  Package,
  Boxes,
  FileText,
  Megaphone,
  Newspaper,
  Wrench,
  UsersRound,
  IdCard,
  type LucideIcon,
} from "lucide-react";

export type AdminModule = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  /** small note rendered under the title, e.g. a workflow hint */
  note?: string;
};

/** Setup Eksternal — entitas yang terhubung dengan klien (Client Facing) */
export const externalModules: AdminModule[] = [
  { title: "Users", description: "Kelola akun pengguna sistem", href: "/admin/users", icon: Users },
  { title: "Organizations", description: "Setup dan kelola organisasi", href: "/admin/organizations", icon: Building2 },
  { title: "Locations", description: "Kelola lokasi operasional", href: "/admin/locations", icon: MapPin },
  { title: "Inventory Items", description: "Kelola produk per organisasi", href: "/admin/product-types", icon: Package },
  { title: "Master Products", description: "Katalog produk global", href: "/admin/master-products", icon: Boxes },
  { title: "Contracts", description: "Kelola kontrak & perjanjian", href: "/admin/contracts", icon: FileText },
  { title: "Announcements", description: "Pengumuman per produk", href: "/admin/announcements", icon: Megaphone },
  {
    title: "User Articles",
    description: "Workflow author → review → publish",
    href: "/admin/user-articles",
    icon: Newspaper,
  },
];

/** Setup Internal — struktur tim, engineer, konfigurasi internal (Team Management) */
export const internalModules: AdminModule[] = [
  { title: "Engineers", description: "Kelola engineer dan skill", href: "/admin/engineers", icon: Wrench },
  { title: "Team Groups", description: "Buat dan kelola grup tim", href: "/admin/team-groups", icon: UsersRound },
  { title: "Team Members", description: "Kelola anggota & role tim", href: "/admin/team-members", icon: IdCard },
];

export type NavItem = { label: string; href: string; icon: LucideIcon };
export type NavSection = { label: string; items: NavItem[] };

const toNavItem = (m: AdminModule): NavItem => ({ label: m.title, href: m.href, icon: m.icon });

/** Sidebar navigation — semua modul, dikelompokkan seperti console */
export const adminNav: NavSection[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/admin", icon: LayoutDashboard }],
  },
  {
    label: "External Setup",
    items: externalModules.map(toNavItem),
  },
  {
    label: "Internal",
    items: internalModules.map(toNavItem),
  },
];

/** Map pathname → judul yang ditampilkan di topbar */
export const adminTitles: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/users": "Users",
  "/admin/organizations": "Organizations",
  "/admin/locations": "Locations",
  "/admin/product-types": "Inventory Items",
  "/admin/master-products": "Master Products",
  "/admin/contracts": "Contracts",
  "/admin/announcements": "Announcements",
  "/admin/user-articles": "User Articles",
  "/admin/engineers": "Engineers",
  "/admin/team-groups": "Team Groups",
  "/admin/team-members": "Team Members",
};

/** Cari judul terbaik berdasarkan prefix terpanjang yang cocok */
export function titleFromPath(pathname: string): string {
  let best = "";
  for (const key of Object.keys(adminTitles)) {
    if ((pathname === key || pathname.startsWith(key + "/")) && key.length > best.length) {
      best = key;
    }
  }
  return best ? adminTitles[best] : "Admin";
}
