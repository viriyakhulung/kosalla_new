import type { Role } from "./types";

/**
 * Map role ke default route path
 */
export function routeByRole(role?: Role | string): string {
  if (!role) return "/portal";

  switch (role) {
    case "super-admin":
    case "superadmin":
      return "/admin";
    case "engineer-manager":
    case "engineer-staff":
    case "viriyastaff":
      return "/engineer";
    case "enduser":
    case "custstaff":
      return "/portal";
    default:
      return "/portal";
  }
}

/**
 * Format role name untuk display
 */
export function formatRoleName(role: Role | string): string {
  const roleMap: Record<string, string> = {
    "super-admin": "Super Admin",
    "superadmin": "Super Admin",
    "engineer-manager": "Engineer Manager",
    "engineer-staff": "Engineer Staff",
    "viriyastaff": "Viriya Staff",
    "enduser": "End User",
    "custstaff": "Customer Staff",
  };

  return roleMap[role] || role;
}
