export const ADMIN_ROLES = ["admin", "super_admin"] as const;

export function isAdminRole(role: unknown): boolean {
  return ADMIN_ROLES.includes(role as (typeof ADMIN_ROLES)[number]);
}
