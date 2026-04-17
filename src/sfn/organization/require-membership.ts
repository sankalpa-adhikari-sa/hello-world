import { and, eq } from 'drizzle-orm'

import { member } from '@/db/schema/auth.schema'
import { db } from '@/db'
import { OrgRoles } from '@/sfn/organization/org-roles'

/**
 * Fetch the membership record of a user within a specific organization.
 *
 * This function does NOT enforce authorization — it simply returns the membership
 * if it exists, or `null` if the user is not part of the organization.
 *
 * @param userId - The unique ID of the user
 * @param organizationId - The unique ID of the organization
 *
 * @returns The membership row if found, otherwise `null`
 *
 * @example
 * const membership = await requireOrgMembership(user.id, orgId)
 * if (!membership) {
 *   // user is not part of this organization
 * }
 */
export async function requireOrgMembership(
  userId: string,
  organizationId: string,
) {
  const row = await db.query.member.findFirst({
    where: and(
      eq(member.userId, userId),
      eq(member.organizationId, organizationId),
    ),
  })
  return row
}

/**
 * Ensures that a user belongs to an organization AND has one of the required roles.
 *
 * This is an authorization guard. It throws an error if:
 * - the user is not a member of the organization, OR
 * - the user does not have one of the allowed roles
 *
 * Useful for protecting server actions, API routes, or sensitive operations.
 *
 * @param userId - The unique ID of the user
 * @param organizationId - The unique ID of the organization
 * @param roles - List of allowed roles (e.g. ['owner', 'admin'])
 *
 * @throws {Error} "Unauthorized" if access is denied
 *
 * @returns The membership row if authorization succeeds
 *
 * @example
 * // Only allow admins and owners
 * await requireRole(user.id, orgId, ['admin', 'owner'])
 *
 * @example
 * // Inside an API handler
 * const membership = await requireRole(user.id, orgId, ['owner'])
 * // safe to proceed — user is owner
 */
export async function requireRole(
  userId: string,
  organizationId: string,
  roles: (typeof OrgRoles)[number][],
) {
  const membership = await requireOrgMembership(userId, organizationId)

  if (!membership) {
    throw new Error('Unauthorized')
  }

  const role = membership.role as (typeof OrgRoles)[number]

  if (!roles.includes(role)) {
    throw new Error('Unauthorized')
  }

  return membership
}
