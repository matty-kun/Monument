export const ADMIN_ROLES = ["admin", "super_admin"] as const;
export const SCORER_ROLES = ["scorer"] as const;

export function isAdminRole(role: unknown): boolean {
  return ADMIN_ROLES.includes(role as (typeof ADMIN_ROLES)[number]);
}

export function isDashboardAccessRole(role: unknown): boolean {
  return isAdminRole(role) || SCORER_ROLES.includes(role as (typeof SCORER_ROLES)[number]);
}
