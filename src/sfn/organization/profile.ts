import { createServerFn } from '@tanstack/react-start'

import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { queryOptions } from '@tanstack/react-query'
import { organizationProfile } from '@/db/schema/organization.schema'
import { organizationProfileFormSchema } from '@/types/organization-form'

import { MANAGER_ROLES } from '@/sfn/organization/org-roles'
import { getCurrentUser } from '@/sfn/users'
import { db } from '@/db'
import { requireOrgMembership } from '@/sfn/organization/require-membership'

/**
 * Zod schema for loading organization profile (Drizzle) for a given org.
 */
export const GetOrganizationProfileSchema = z.object({
  organizationId: z.uuid(),
})

export type OrganizationProfileRow = typeof organizationProfile.$inferSelect

export type GetOrganizationProfileResult = {
  profile: OrganizationProfileRow
  myRole: string
}

/**
 * Returns the Drizzle `organization_profile` row for an org the user belongs to,
 * ensuring a row exists (legacy orgs without the auth hook).
 */
export const getOrganizationProfile = createServerFn()
  .inputValidator((data: unknown) => GetOrganizationProfileSchema.parse(data))
  .handler(async ({ data }): Promise<GetOrganizationProfileResult> => {
    const { currentUser } = await getCurrentUser()
    const membership = await requireOrgMembership(
      currentUser.id,
      data.organizationId,
    )
    if (!membership) {
      throw new Error('You are not a member of this organization')
    }
    let profile = await db.query.organizationProfile.findFirst({
      where: eq(organizationProfile.organizationId, data.organizationId),
    })
    if (!profile) {
      const [inserted] = await db
        .insert(organizationProfile)
        .values({
          organizationId: data.organizationId,
          content: {},
        })
        .returning()
      profile = inserted
    }
    return { profile, myRole: membership.role }
  })

export const getOrganizationProfileQO = (organizationId: string) =>
  queryOptions({
    queryKey: ['organizationProfile', organizationId],
    queryFn: () => getOrganizationProfile({ data: { organizationId } }),
  })

export const UpdateOrganizationProfileSchema =
  organizationProfileFormSchema.extend({
    organizationId: z.uuid(),
  })

/**
 * Updates `organization_profile` for an org. Requires owner or admin membership.
 */
export const updateOrganizationProfile = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) =>
    UpdateOrganizationProfileSchema.parse(data),
  )
  .handler(async ({ data }) => {
    const { currentUser } = await getCurrentUser()
    const membership = await requireOrgMembership(
      currentUser.id,
      data.organizationId,
    )
    if (!membership || !MANAGER_ROLES.has(membership.role)) {
      throw new Error(
        'Only owners and admins can update the organization profile',
      )
    }
    const existing = await db.query.organizationProfile.findFirst({
      where: eq(organizationProfile.organizationId, data.organizationId),
    })
    if (!existing) {
      throw new Error('Organization profile not found')
    }
    const prevContent =
      existing.content &&
      typeof existing.content === 'object' &&
      !Array.isArray(existing.content)
        ? { ...(existing.content as Record<string, unknown>) }
        : {}
    if (data.about !== undefined && data.about !== null) {
      prevContent.about = data.about
    }
    if (
      data.content !== undefined &&
      data.content !== null &&
      typeof data.content === 'object' &&
      !Array.isArray(data.content) &&
      Object.keys(data.content as object).length > 0
    ) {
      Object.assign(prevContent, data.content as Record<string, unknown>)
    }

    type ProfileInsert = typeof organizationProfile.$inferInsert

    const [row] = await db
      .update(organizationProfile)
      .set({
        subtitle: data.subtitle ?? null,
        content: prevContent as Record<string, unknown>,
        website:
          data.website === '' || data.website === undefined
            ? null
            : data.website,
        location: data.location ?? null,
        industry: data.industry as NonNullable<ProfileInsert['industry']>,
        organizationType: data.organizationType as NonNullable<
          ProfileInsert['organizationType']
        >,
        companySize: (data.companySize ?? null) as ProfileInsert['companySize'],
        foundedYear: data.foundedYear ?? null,
        contactEmail:
          data.contactEmail === '' || data.contactEmail === undefined
            ? null
            : data.contactEmail,
        linkedinUrl:
          data.linkedinUrl === '' || data.linkedinUrl === undefined
            ? null
            : data.linkedinUrl,
        twitterUrl:
          data.twitterUrl === '' || data.twitterUrl === undefined
            ? null
            : data.twitterUrl,
        updatedAt: new Date(),
      })
      .where(eq(organizationProfile.organizationId, data.organizationId))
      .returning()
    return row
  })
