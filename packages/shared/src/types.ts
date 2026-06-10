// Role Types
export type Role = "super-admin" | "engineer-manager" | "engineer-staff" | "enduser";

// Master Role Type
export type MasterRole = {
  id: number;
  name: "superadmin" | "viriyastaff" | "custstaff";
  description: string;
  created_at: string;
  updated_at: string;
};

// Organization Type
export type Organization = {
  id: number;
  name: string;
  slug: string;
  contact_email: string | null;
  phone: string | null;
  address: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

// Location Type
export type Location = {
  id: number;
  organization_id: number;
  name: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

// Team Group Type
export type TeamGroup = {
  id: number;
  name: string;
  code: string;
  handles_category: string | null;
  organization_id: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

// Team Member Type (user inside a team group, includes pivot fields)
export type TeamMember = {
  id: number;
  name: string;
  email: string;
  master_role_id?: number | null;
  organization_id?: number | null;
  location_id?: number | null;
  role: "engineer-staff" | "engineer-manager" | "team-lead";
  is_active: boolean;
};

// Inventory Item Type
export type InventoryItem = {
  id: number;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  location_id: number | null;
  created_at: string;
  updated_at: string;
};

// Contract Type
export type Contract = {
  id: number;
  organization_id: number;
  contract_number: string;
  start_date: string;
  end_date: string;
  status: "active" | "expired" | "terminated";
  reminder_days_before_end: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

// Ticket Comment Type
export type TicketComment = {
  id: number;
  ticket_id: number;
  user_id: number;
  content: string;
  created_at: string;
  updated_at: string;
  user?: User;
};

// Ticket Type
export type Ticket = {
  id: number;
  organization_id: number;
  location_id: number | null;
  contract_id: number | null;
  created_by: number;
  team_group_id: number | null;
  assigned_to: number | null;
  subject: string;
  description: string;
  description_html?: string | null;
  status: "open" | "in-progress" | "resolved" | "closed";
  priority: "low" | "normal" | "high";
  resolved_at: string | null;
  closed_at: string | null;
  last_activity_at: string | null;
  created_at: string;
  updated_at: string;
  creator?: User;
  assignee?: User;
  team_group?: TeamGroup;
  contract?: Contract;
  comments?: TicketComment[];
};

// User Type
export type User = {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  organization_id: number | null;
  location_id: number | null;
  master_role_id: number | null;
  is_active: boolean;
  must_change_password: boolean;
  last_login_at: string | null;
  roles: string[];
  permissions: string[];
  masterRole?: MasterRole;
  organization?: Organization;
  location?: Location;
  created_at: string;
  updated_at: string;
};

// Auth Types
export type AuthResponse = {
  user: User;
  roles: Role[];
  permissions: string[];
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  token?: string;
  message: string;
};

// API Response Types
export type ApiResponse<T> = {
  data?: T;
  message: string;
  errors?: Record<string, string[]>;
  success?: boolean;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    current_page: number;
    total: number;
    per_page: number;
    last_page: number;
  };
};

// Filter Types
export type TicketFilters = {
  status?: Ticket["status"];
  priority?: Ticket["priority"];
  assigned_to?: number;
  search?: string;
  page?: number;
  per_page?: number;
};

export type ContractFilters = {
  status?: Contract["status"];
  organization_id?: number;
  search?: string;
  page?: number;
  per_page?: number;
};

export type UserFilters = {
  organization_id?: number;
  role?: string;
  search?: string;
  page?: number;
  per_page?: number;
};

// Pagination Meta
export type PaginationMeta = {
  current_page: number;
  total: number;
  per_page: number;
  last_page: number;
  from: number;
  to: number;
};
