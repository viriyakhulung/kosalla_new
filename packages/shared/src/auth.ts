import type { Role } from "./types";

export function routeByRole(role: Role) {
  if (role === "super-admin") return "/admin";
  if (role === "engineer-manager" || role === "engineer-staff") return "/engineer";
  return "/portal";
}
