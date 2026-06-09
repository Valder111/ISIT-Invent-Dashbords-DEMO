import type { UserRole } from '../api/auth'

const ROLE_ICON: Record<UserRole, string> = {
  admin: '/static/images/users/admin.svg',
  inventory_manager: '/static/images/users/inventory.svg',
  laborant: '/static/images/users/laborant.svg',
  user: '/static/images/users/user.svg',
}

export function userRoleIcon(role: UserRole | string): string {
  return ROLE_ICON[role as UserRole] ?? ROLE_ICON.user
}
