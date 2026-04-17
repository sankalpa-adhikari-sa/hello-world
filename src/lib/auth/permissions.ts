import { createAccessControl } from 'better-auth/plugins/access'
import { defaultStatements } from 'better-auth/plugins/organization/access'

/**
 * Merge org-plugin defaults with app-specific `project` actions.
 *
 * If `statement` only defines `project`, the organization plugin still checks
 * built-in permissions such as `{ member: ["delete"] }` on remove-member —
 * those checks always fail, so even owners get "not allowed to delete this member".
 */
const statement = {
  ...defaultStatements,
  project: ['create', 'share', 'update', 'delete'],
} as const

const ac = createAccessControl(statement)

const member = ac.newRole({
  organization: [],
  member: [],
  invitation: [],
  team: [],
  ac: ['read'],
  project: ['create'],
})

const admin = ac.newRole({
  organization: ['update'],
  member: ['create', 'update', 'delete'],
  invitation: ['create', 'cancel'],
  team: ['create', 'update', 'delete'],
  ac: ['create', 'read', 'update', 'delete'],
  project: ['create', 'update'],
})

const owner = ac.newRole({
  organization: ['update', 'delete'],
  member: ['create', 'update', 'delete'],
  invitation: ['create', 'cancel'],
  team: ['create', 'update', 'delete'],
  ac: ['create', 'read', 'update', 'delete'],
  project: ['create', 'update', 'delete'],
})

export { admin, owner, member, ac, statement }
