import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'

import { z } from 'zod'
import { queryOptions } from '@tanstack/react-query'
import { getCurrentUser } from '../users'
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
    await getCurrentUser()
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
