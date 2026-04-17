import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'

import { z } from 'zod'
import { queryOptions } from '@tanstack/react-query'

import { MANAGER_ROLES, OrgRoles } from '@/sfn/organization/org-roles'
import { getCurrentUser } from '@/sfn/users'
import { auth } from '@/lib/auth/auth'
import { requireRole } from './require-membership'

/**
 * Zod schema for validating list members query parameters.
 */
export const ListMembersSchema = z.object({
  organizationId: z
    .string()
    .optional()
    .describe(
      "An optional organization ID to list members for. If not provided, will default to the user's active organization.",
    ),
  limit: z.number().optional().describe('The limit of members to return.'),
  offset: z.number().optional().describe('The offset to start from.'),
  sortBy: z.string().optional().describe('The field to sort by.'),
  sortDirection: z
    .enum(['asc', 'desc'])
    .optional()
    .describe('The direction to sort by.'),
  filterField: z.string().optional().describe('The field to filter by.'),
  filterOperator: z
    .enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'contains'])
    .optional()
    .describe('The operator to filter by.'),
  filterValue: z.string().optional().describe('The value to filter by.'),
})

/**
 * Lists members of an organization.
 *
 * - **Requires Auth:** Yes
 * - **Context:** Defaults to active organization if ID is not provided.
 *
 * @param data - Query parameters (limit, offset, sort, etc.)
 * @returns A list of members.
 */
export const listOrganizationMembers = createServerFn()
  .inputValidator((data: unknown) => ListMembersSchema.parse(data))
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    await getCurrentUser()
    const members = await auth.api.listMembers({
      query: {
        organizationId: data.organizationId,
        limit: data.limit,
        offset: data.offset,
        sortBy: data.sortBy,
        sortDirection: data.sortDirection,
        filterField: data.filterField,
        filterOperator: data.filterOperator,
        filterValue: data.filterValue,
      },
      headers,
    })
    return members
  })

/**
 * React Query options for fetching organization members.
 *
 * @param params - The filtering and sorting options defined in ListMembersSchema
 */
export const listOrganizationMembersQO = (
  params: z.infer<typeof ListMembersSchema> = {},
) => {
  return queryOptions({
    queryKey: ['organizationMembers', params],
    queryFn: () => listOrganizationMembers({ data: params }),
  })
}

/**
 * Zod schema for removing a member.
 */
export const RemoveMemberSchema = z.object({
  memberIdOrEmail: z
    .string()
    .describe('The ID or email of the member to remove.'),
  organizationId: z
    .string()
    .optional()
    .describe(
      'The ID of the organization to remove the member from. If not provided, the active organization will be used.',
    ),
})

/**
 * Removes a member from an organization. Only Owners and Admins can remove members from organization
 *
 * - **Requires Auth:** Yes
 * - **Method:** POST
 *
 * @param data - Contains memberIdOrEmail and optional organizationId.
 * @returns The result of the remove operation.
 */
export const removeOrganizationMember = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => RemoveMemberSchema.parse(data))
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    const { currentUser, session } = await getCurrentUser()
    const organizationId =
      data.organizationId ?? session.session.activeOrganizationId
    if (!organizationId) return null

    await requireRole(currentUser.id, organizationId, [...MANAGER_ROLES])
    const result = await auth.api.removeMember({
      body: {
        memberIdOrEmail: data.memberIdOrEmail,
        organizationId: organizationId,
      },
      headers,
    })
    return result
  })

/**
 * Zod schema for adding a member to an organization.
 * Validates userId, role (single string or array), and optional context IDs.
 */
export const AddMemberSchema = z.object({
  userId: z
    .string()
    .describe(
      "The user ID which represents the user to be added as a member. If null is provided, then it's expected to provide session headers.",
    ),
  role: z
    .union([z.enum(OrgRoles), z.array(z.enum(OrgRoles))])
    .describe('The role(s) to assign to the new member.'),
  organizationId: z
    .string()
    .optional()
    .describe(
      "An optional organization ID to pass. If not provided, will default to the user's active organization.",
    ),
})

/**
 * Adds a member directly to an organization (server-side only) without sending invitation .
 *
 * - **Requires Auth:** Yes (Caller must have permissions)
 * - **Method:** POST
 * - **Note:** If `organizationId` is omitted, the operation will default to the user's active organization..
 *
 * @param data - The member details (userId, role, organizationId, teamId).
 * @returns The result of the add member operation.
 */
export const addOrganizationMemberDirectly = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => AddMemberSchema.parse(data))
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    const { currentUser, session } = await getCurrentUser()
    const organizationId =
      data.organizationId ?? session.session.activeOrganizationId
    if (!organizationId) return null

    await requireRole(currentUser.id, organizationId, [...MANAGER_ROLES])
    const result = await auth.api.addMember({
      body: {
        userId: data.userId,
        role: data.role,
        organizationId: organizationId,
      },
      headers,
    })
    return result
  })

/**
 * Zod schema for leaving an organization.
 */
export const LeaveOrganizationSchema = z.object({
  organizationId: z
    .string()
    .describe('The organization ID for the member to leave.'),
})

/**
 * Removes the current user from an organization.
 *
 * - **Requires Auth:** Yes
 * - **Method:** POST
 * - **Side Effect:** User loses access to the specified organization.
 *
 * @param data - The organizationId to leave.
 * @returns The result of the leave operation.
 */
export const leaveOrganization = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => LeaveOrganizationSchema.parse(data))
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    await getCurrentUser()
    const result = await auth.api.leaveOrganization({
      body: {
        organizationId: data.organizationId,
      },
      headers,
    })
    return result
  })

/**
 * Zod schema for updating a member's role in an organization.
 * Validates memberId, role (single string or array), and optional OrganizatonId.
 */
export const UpdateMemberRoleSchema = z.object({
  memberId: z.string().describe('The member id to apply the role update to.'),
  role: z
    .union([z.enum(OrgRoles), z.array(z.enum(OrgRoles))])
    .describe(
      'The new role to be applied. This can be a string or array of strings representing the roles.',
    ),
  organizationId: z
    .string()
    .optional()
    .describe(
      'An optional organization ID which the member is a part of to apply the role update. If not provided, you must provide session headers to get the active organization.',
    ),
})

/**
 * Updates the role of a member in an organization *
 * - **Requires Auth:** Yes
 * - **Method:** POST
 *
 * @param data - The organizationId, role, memberId.
 */
export const updateMemberRole = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => UpdateMemberRoleSchema.parse(data))
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    await getCurrentUser()
    const result = await auth.api.updateMemberRole({
      body: {
        memberId: data.memberId,
        role: data.role,
        organizationId: data.organizationId,
      },
      headers,
    })
    return result
  })
