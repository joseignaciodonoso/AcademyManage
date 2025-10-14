import { UserRole } from "@/lib/types"

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [UserRole.SUPER_ADMIN]: [
    "academy:read",
    "academy:write",
    "academy:delete",
    "branch:read",
    "branch:write",
    "branch:delete",
    "user:read",
    "user:write",
    "user:delete",
    "students:read",
    "students:write",
    "plan:read",
    "plan:write",
    "plan:delete",
    "payment:read",
    "payment:write",
    "content:read",
    "content:write",
    "content:delete",
    "class:read",
    "class:write",
    "class:delete",
    "report:read",
    "audit:read",
  ],
  [UserRole.ACADEMY_ADMIN]: [
    "branch:read",
    "branch:write",
    "user:read",
    "user:write",
    "students:read",
    "students:write",
    "plan:read",
    "plan:write",
    "payment:read",
    "payment:write",
    "content:read",
    "content:write",
    "content:delete",
    "class:read",
    "class:write",
    "class:delete",
    "report:read",
    "curriculum:read",
    "curriculum:write",
    "branding:read",
    "branding:write",
  ],
  [UserRole.COACH]: [
    "class:read",
    "class:write",
    "attendance:read",
    "attendance:write",
    "content:read",
    "content:write",
    "assessment:read",
    "assessment:write",
  ],
  [UserRole.ASSISTANT_COACH]: [
    "class:read",
    "attendance:read",
    "content:read",
  ],
  [UserRole.STUDENT]: [
    "profile:read",
    "profile:write",
    "class:read",
    "enrollment:read",
    "enrollment:write",
    "content:read",
    "payment:read",
    "payment:write",
    "attendance:read",
    "attendance:write",
  ],
  [UserRole.FINANCE]: ["payment:read", "report:read", "plan:read"],
}

export function hasPermission(userRole: UserRole, permission: string): boolean {
  return ROLE_PERMISSIONS[userRole]?.includes(permission) || false
}

export function requirePermission(userRole: UserRole, permission: string) {
  if (!hasPermission(userRole, permission)) {
    throw new Error(`Insufficient permissions. Required: ${permission}`)
  }
}
