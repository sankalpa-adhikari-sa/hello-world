export const OrgRoles = ['member', 'owner', 'admin'] as const

export const MANAGER_ROLES = new Set<(typeof OrgRoles)[number]>([
  'owner',
  'admin',
])
