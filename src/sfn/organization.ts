import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'

import { z } from 'zod'
import { queryOptions } from '@tanstack/react-query'
import { getCurrentUser } from './users'
import { auth } from '@/lib/auth/auth'

/**
 * Fetches all organizations the currently authenticated user belongs to.
 *
 * - Requires an authenticated user
 * - Uses request headers for auth context
 *
 * @returns A list of organizations associated with the current user
 */
export const listUserOrganizations = createServerFn().handler(async () => {
  const headers = getRequestHeaders()
  await getCurrentUser()
  const organizations = await auth.api.listOrganizations({
    headers: headers,
  })
  return organizations
})

/**
 * React Query options for fetching the current user's organizations.
 *
 * Intended to be used with `useQuery(listUserOrganizationsQO())`.
 * - Uses server function:  listUserOrganizations
 */
export const listUserOrganizationsQO = () => {
  return queryOptions({
    queryKey: ['userOrganizations'],
    queryFn: () => listUserOrganizations(),
  })
}

/**
 * Zod schema for validating the organization ID when switching contexts.
 */
export const SetActiveOrganizationByIdSchema = z.object({
  organizationId: z
    .string()
    .describe(
      'The organization ID to set as active. It can be null to unset the active organization.',
    ),
})

/**
 * Sets the active organization for the current user's session.
 *
 * - **Requires Auth:** Yes
 * - **Validation:** Validates input against `SetActiveOrganizationByIdSchema`
 * - **Side Effect:** Updates the session to reflect the selected organization context.
 *
 * @param data - The input object containing the `organizationId`.
 * @returns The result of the set active organization operation.
 */
export const setActiveOrganizationById = createServerFn()
  .inputValidator((data: unknown) =>
    SetActiveOrganizationByIdSchema.parse(data),
  )
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    await getCurrentUser()
    const activeOrganization = await auth.api.setActiveOrganization({
      body: { organizationId: data.organizationId },
      headers: headers,
    })
    return activeOrganization
  })

/**
 * Zod schema for validating new organization details.
 * Enforces minimum length for name and slug.
 */
export const CreateOrgSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .describe('The organization name.'),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .describe('The organization slug.'),
  logo: z.url().optional().describe('The organization logo.'),
  metadata: z
    .record(z.string(), z.any())
    .optional()
    .describe('The metadata of the organization.'),
})

/**
 * Creates a new organization.
 *
 * - **Requires Auth:** Yes
 * - **Behavior:** Automatically sets the new organization as the active one (via `keepCurrentActiveOrganization: false`).
 *
 * @param data - The organization details (name, slug, logo, metadata).
 * @returns The created organization object.
 */
export const createOrganization = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => CreateOrgSchema.parse(data))
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    const org = await auth.api.createOrganization({
      body: {
        name: data.name,
        slug: data.slug,
        logo: data.logo,
        metadata: data.metadata,
        keepCurrentActiveOrganization: false,
      },
      headers,
    })
    return org
  })

/**
 * Zod schema for validating when updating organization details.
 */
export const UpdateOrganizationSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .optional()
    .describe('The name of the organization.'),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .optional()
    .describe('The slug of the organization.'),
  logo: z.url().optional().describe('The logo of the organization.'),
  metadata: z
    .record(z.string(), z.any())
    .optional()
    .describe('The metadata of the organization.'),
  organizatonId: z.string().describe('The organization ID. to update.'),
})

/**
 * Updates a organization.
 *
 * - **Requires Auth:** Yes
 *
 * @param data - The organization details (name, slug, logo, metadata, organizatonId).
 * @returns The updated organization object.
 */
export const updateOrganization = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => UpdateOrganizationSchema.parse(data))
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    const org = await auth.api.updateOrganization({
      body: {
        data: {
          name: data.name ?? undefined,
          slug: data.slug ?? undefined,
          logo: data.logo ?? undefined,
          metadata: data.metadata ?? undefined,
        },
        organizationId: data.organizatonId,
      },
      headers,
    })
    return org
  })

/**
 * Zod schema for validating when deleting organization.
 */
export const DeleteOrganizationSchema = z.object({
  organizatonId: z.string().describe('The organization ID to delete.'),
})

/**
 * Deletes a organization.
 *
 * - **Requires Auth:** Yes
 *
 * @param data - The organization id (organizatonId).
 * @returns The deleted organization object.
 */
export const deleteOrganization = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => DeleteOrganizationSchema.parse(data))
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    const org = await auth.api.deleteOrganization({
      body: {
        organizationId: data.organizatonId,
      },
      headers,
    })
    return org
  })

/**
 * Zod schema for checking if a slug is available.
 */
export const CheckOrgSlugSchema = z.object({
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .describe('The organization slug to check.'),
})

/**
 * Checks if a specific organization slug is already taken.
 * Useful for async form validation during organization creation.
 *
 * @param data - Object containing the `slug` to check.
 * @returns The status of the slug check (boolean).
 */
export const isSlugTaken = createServerFn()
  .inputValidator((data: unknown) => CheckOrgSlugSchema.parse(data))
  .handler(async ({ data }) => {
    getCurrentUser()
    const checkeddata = await auth.api.checkOrganizationSlug({
      body: {
        slug: data.slug,
      },
    })
    return checkeddata.status
  })
/**
 * React Query options for checking organization slug availability.
 *
 * Intended to be used with `useQuery(checkOrgSlugQO(slug))`.
 * * - **Usage:** Pass to `useQuery` for real-time validation feedback.
 * - **Optimization:** Automatically disabled for short slugs (< 2 chars).
 * - **Caching:** Results are cached for 1 minute to reduce API calls on repeated inputs.
 *
 * @param slug - The slug string to check
 */
export const checkOrgSlugQO = (slug: string) => {
  return queryOptions({
    queryKey: ['orgSlugCheck', slug],
    queryFn: () => isSlugTaken({ data: { slug } }),
    enabled: !!slug && slug.length >= 2,
    staleTime: 1000 * 60,
    retry: false,
  })
}

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
 * Removes a member from an organization.
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
    await getCurrentUser()
    const result = await auth.api.removeMember({
      body: {
        memberIdOrEmail: data.memberIdOrEmail,
        organizationId: data.organizationId,
      },
      headers,
    })
    return result
  })

export const OrgRoles = ['member', 'owner', 'admin'] as const

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
    await getCurrentUser()
    const result = await auth.api.addMember({
      body: {
        userId: data.userId,
        role: data.role,
        organizationId: data.organizationId,
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
export const upddateMemberRole = createServerFn({ method: 'POST' })
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
