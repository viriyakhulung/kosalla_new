// Re-export semua types dari shared package
export type {
  Role,
  MasterRole,
  Organization,
  Location,
  TeamGroup,
  InventoryItem,
  Contract,
  TicketComment,
  Ticket,
  User,
  AuthResponse,
  LoginPayload,
  LoginResponse,
  ApiResponse,
  PaginatedResponse,
  TicketFilters,
  ContractFilters,
  UserFilters,
  PaginationMeta,
} from "@kosalla/shared";

import type { Role } from "@kosalla/shared";

// Frontend-specific types
export type ToastType = "success" | "error" | "warning" | "info";

export type Toast = {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
};

export type FormError = {
  field: string;
  message: string;
};

export type PageState = "loading" | "idle" | "error" | "success";

// Navigation types
export type NavItem = {
  label: string;
  href: string;
  icon?: string;
  roles?: Role[];
  children?: NavItem[];
};
