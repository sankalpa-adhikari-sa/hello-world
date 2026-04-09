import { createServerFn } from '@tanstack/react-start'
import { queryOptions } from '@tanstack/react-query'
import {
  and,
  asc,
  count,
  desc,
  eq,
  exists,
  ilike,
  inArray,
  or,
  sql,
} from 'drizzle-orm'
import { z } from 'zod'

import { getCurrentUser } from './users'

import type { FundAProjectOutput } from '@/types/fund-a-project'
import { db } from '@/db'
import {
  fundAProject,
  fundAProjectTags,
} from '@/db/schema/fund_a_project.schema'
import { tags } from '@/db/schema/tags.schema'
import {
  fundAProjectInputSchema,
  fundAProjectOutputSchema,
} from '@/types/fund-a-project'

type FundRow = typeof fundAProject.$inferSelect

type FundWithJoins = FundRow & {
  createdBy: {
    id: string
    name: string
    email: string
    image: string | null
    profile: {
      displayName: string | null
      isStudent: boolean | null
      studentMajor: string | null
      studentGraduationYear: number | null
    } | null
  }
  fundAProjectTags: Array<{
    tag: { id: string; name: string; isPublic: boolean | null }
  }>
}

function toFundAProjectOutput(row: FundWithJoins): FundAProjectOutput {
  const { fundAProjectTags: junction, createdBy, ...base } = row
  const tagList = junction.map((j) => ({
    id: j.tag.id,
    name: j.tag.name,
    isPublic: j.tag.isPublic ?? false,
  }))
  return fundAProjectOutputSchema.parse({
    ...base,
    tags: tagList,
    createdBy: {
      name: createdBy.name,
      email: createdBy.email,
      image: createdBy.image,
      displayName: createdBy.profile?.displayName ?? null,
      isStudent: createdBy.profile?.isStudent ?? false,
      studentMajor: createdBy.profile?.studentMajor ?? null,
      studentGraduationYear: createdBy.profile?.studentGraduationYear ?? null,
    },
  })
}

async function assertAllTagIdsExist(tagIds: Array<string>) {
  if (tagIds.length === 0) return
  const unique = [...new Set(tagIds)]
  const rows = await db
    .select({ id: tags.id })
    .from(tags)
    .where(inArray(tags.id, unique))
  if (rows.length !== unique.length) {
    throw new Error('One or more tag IDs are invalid')
  }
}

async function loadFundAProjectWithJoins(
  id: string,
): Promise<FundAProjectOutput | null> {
  const row = await db.query.fundAProject.findFirst({
    where: eq(fundAProject.id, id),
    with: {
      createdBy: { with: { profile: true } },
      fundAProjectTags: { with: { tag: true } },
    },
  })
  return row ? toFundAProjectOutput(row) : null
}

export const getFundAProjectByIdInputSchema = z.object({
  id: z.uuid(),
})

/**
 * Loads one fund-a-project row with tags, creator, and `card` props for the listing UI.
 * Public (no auth).
 */
export const getFundAProjectById = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => getFundAProjectByIdInputSchema.parse(data))
  .handler(async ({ data }) => loadFundAProjectWithJoins(data.id))

export const getFundAProjectByIdQO = (id: string) =>
  queryOptions({
    queryKey: ['fund-a-project', id],
    queryFn: () => getFundAProjectById({ data: { id } }),
  })

export const getFundAProjectsInputSchema = z.object({
  /** 1-based page index */
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(12),
  searchParam: z
    .object({
      query: z.string().optional(),
      sort: z.enum(['newest', 'oldest', 'urgent']).optional(),
      tagIds: z.array(z.uuid()).max(50).optional(),
      /** When true, only rows with `isFeatured === true`. */
      featuredOnly: z.boolean().optional(),
      projectLevels: z
        .array(fundAProjectInputSchema.shape.projectLevel)
        .max(10)
        .optional(),
    })
    .optional(),
})

export type GetFundAProjectsInput = z.infer<typeof getFundAProjectsInputSchema>

export type GetFundAProjectsResult = {
  items: Array<FundAProjectOutput>
  total: number
  page: number
  pageSize: number
}

/** URL search params for `/_public/fund-a-project` */
export const fundAPublicListSearchSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce.number().int().min(1).max(50).catch(12),
  q: z
    .string()
    .optional()
    .transform((s) => (s === '' || s === undefined ? undefined : s)),
  sort: z.enum(['newest', 'oldest', 'urgent']).catch('newest'),
  tags: z
    .string()
    .optional()
    .transform((s) => (s === '' || s === undefined ? undefined : s)),
  levels: z
    .string()
    .optional()
    .transform((s) => (s === '' || s === undefined ? undefined : s)),
  featured: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((s) => {
      if (s === true || s === '1' || s === 'true') return true
      return undefined
    }),
})

export type FundAPublicListSearch = z.infer<typeof fundAPublicListSearchSchema>

/** Lowest funded ratio first (then newest as tie-breaker). */
const urgencyOrderSql = sql`CASE WHEN ${fundAProject.targetAmount} > 0 THEN (${fundAProject.fundedAmount}::numeric / NULLIF(${fundAProject.targetAmount}, 0)) ELSE 1 END`

/**
 * Lists fund-a-project rows with optional title/subtitle search, tag filter (any match),
 * optional level and featured filters, sort (newest / oldest / urgent), and offset pagination.
 * Public (no auth).
 */
export const getFundAProjects = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) =>
    getFundAProjectsInputSchema.parse(
      data === undefined || data === null ? {} : data,
    ),
  )
  .handler(async ({ data }): Promise<GetFundAProjectsResult> => {
    const limit = data.limit
    const requestedPage = data.page
    const q = data.searchParam?.query
    const sortMode = data.searchParam?.sort ?? 'newest'
    const tagIds = data.searchParam?.tagIds?.filter(Boolean)
    const featuredOnly = data.searchParam?.featuredOnly === true
    const projectLevels = data.searchParam?.projectLevels?.filter(Boolean)

    const filters = []
    if (q?.trim()) {
      const pattern = `%${q.trim()}%`
      filters.push(
        or(
          ilike(fundAProject.title, pattern),
          ilike(fundAProject.subtitle, pattern),
        )!,
      )
    }
    if (featuredOnly) {
      filters.push(eq(fundAProject.isFeatured, true))
    }
    if (projectLevels?.length) {
      filters.push(
        inArray(
          fundAProject.projectLevel,
          projectLevels as Array<'highschool' | 'undergrad' | 'grad'>,
        ),
      )
    }
    if (tagIds?.length) {
      filters.push(
        exists(
          db
            .select()
            .from(fundAProjectTags)
            .where(
              and(
                eq(fundAProjectTags.fundAProjectId, fundAProject.id),
                inArray(fundAProjectTags.tagId, tagIds),
              ),
            ),
        ),
      )
    }

    const whereClause = filters.length ? and(...filters) : undefined

    const [countRow] = await db
      .select({ total: count() })
      .from(fundAProject)
      .where(whereClause)

    const total = Number(countRow.total)
    const totalPages = Math.max(1, Math.ceil(total / limit))
    const page = Math.min(Math.max(1, requestedPage), totalPages)
    const offset = (page - 1) * limit

    const orderBy =
      sortMode === 'urgent'
        ? [asc(urgencyOrderSql), desc(fundAProject.createdAt)]
        : sortMode === 'oldest'
          ? asc(fundAProject.createdAt)
          : desc(fundAProject.createdAt)

    const rows = await db.query.fundAProject.findMany({
      where: whereClause,
      orderBy,
      limit,
      offset,
      with: {
        createdBy: { with: { profile: true } },
        fundAProjectTags: { with: { tag: true } },
      },
    })

    return {
      items: rows.map(toFundAProjectOutput),
      total,
      page,
      pageSize: limit,
    }
  })

export const getFundAProjectsQO = (
  input: Partial<GetFundAProjectsInput> = {},
) => {
  const parsed = getFundAProjectsInputSchema.parse(input)
  return queryOptions({
    queryKey: ['fund-a-projects', parsed],
    queryFn: () => getFundAProjects({ data: parsed }),
  })
}

export const createFundAProjectSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().nullish(),
  targetAmount: z.number().int().min(1),
  fundedAmount: z.number().int().min(0),
  projectLevel: fundAProjectInputSchema.shape.projectLevel.default('undergrad'),
  coverImageUrl: z.string().nullish(),
  coverImageAlt: z.string().nullish(),
  content: z.any().optional().default({}),
  tagIds: z.array(z.uuid()).max(50).optional(),
})

export type CreateFundAProjectInput = z.infer<typeof createFundAProjectSchema>

/**
 * Creates a fund-a-project for the authenticated user and attaches optional tags.
 */
export const createFundAProject = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => createFundAProjectSchema.parse(data))
  .handler(async ({ data }) => {
    const { currentUser } = await getCurrentUser()
    const uniqueTagIds = data.tagIds?.length ? [...new Set(data.tagIds)] : []

    return await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(fundAProject)
        .values({
          title: data.title,
          subtitle: data.subtitle ?? null,
          targetAmount: data.targetAmount,
          fundedAmount: data.fundedAmount,
          projectLevel: data.projectLevel as
            | 'highschool'
            | 'undergrad'
            | 'grad',
          coverImageUrl: data.coverImageUrl?.trim() || null,
          coverImageAlt: data.coverImageAlt?.trim() || null,
          content: data.content ?? {},
          createdById: currentUser.id,
        })
        .returning()

      if (uniqueTagIds.length > 0) {
        await assertAllTagIdsExist(uniqueTagIds)
        await tx.insert(fundAProjectTags).values(
          uniqueTagIds.map((tagId) => ({
            fundAProjectId: row.id,
            tagId,
          })),
        )
      }

      const full = await tx.query.fundAProject.findFirst({
        where: eq(fundAProject.id, row.id),
        with: {
          createdBy: { with: { profile: true } },
          fundAProjectTags: { with: { tag: true } },
        },
      })
      return full ? toFundAProjectOutput(full) : null
    })
  })

export const updateFundAProjectSchema = z.object({
  id: z.uuid(),
  title: z.string().min(1).optional(),
  subtitle: z.string().nullish().optional(),
  targetAmount: z.number().int().min(1).optional(),
  fundedAmount: z.number().int().min(0).optional(),
  projectLevel: fundAProjectInputSchema.shape.projectLevel.optional(),
  coverImageUrl: z.string().nullish().optional(),
  coverImageAlt: z.string().nullish().optional(),
  content: z.any().optional(),
  /** When set, replaces all tag links (use `[]` to clear). */
  tagIds: z.array(z.uuid()).max(50).optional(),
})

export type UpdateFundAProjectInput = z.infer<typeof updateFundAProjectSchema>

/**
 * Updates a fund-a-project. Only the creator may update it.
 */
export const updateFundAProject = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => updateFundAProjectSchema.parse(data))
  .handler(async ({ data }) => {
    const { currentUser } = await getCurrentUser()

    const existing = await db.query.fundAProject.findFirst({
      where: and(
        eq(fundAProject.id, data.id),
        eq(fundAProject.createdById, currentUser.id),
      ),
    })
    if (!existing) {
      return null
    }

    const patch: Partial<{
      title: string
      subtitle: string | null
      targetAmount: number
      fundedAmount: number
      projectLevel: 'highschool' | 'undergrad' | 'grad'
      coverImageUrl: string | null
      coverImageAlt: string | null
      content: Record<string, unknown>
    }> = {}

    if (data.title !== undefined) patch.title = data.title
    if (data.subtitle !== undefined) patch.subtitle = data.subtitle ?? null
    if (data.targetAmount !== undefined) patch.targetAmount = data.targetAmount
    if (data.fundedAmount !== undefined) patch.fundedAmount = data.fundedAmount
    if (data.projectLevel !== undefined)
      patch.projectLevel = data.projectLevel as
        | 'highschool'
        | 'undergrad'
        | 'grad'
    if (data.coverImageUrl !== undefined) {
      patch.coverImageUrl = data.coverImageUrl?.trim() || null
    }
    if (data.coverImageAlt !== undefined) {
      patch.coverImageAlt = data.coverImageAlt?.trim() || null
    }
    if (data.content !== undefined) patch.content = data.content

    const hasPatch = Object.keys(patch).length > 0
    const hasTagUpdate = data.tagIds !== undefined

    if (!hasPatch && !hasTagUpdate) {
      return loadFundAProjectWithJoins(data.id)
    }

    const uniqueTagIds =
      data.tagIds !== undefined ? [...new Set(data.tagIds)] : []

    await db.transaction(async (tx) => {
      if (hasPatch) {
        await tx
          .update(fundAProject)
          .set(patch)
          .where(eq(fundAProject.id, data.id))
      }
      if (hasTagUpdate) {
        await tx
          .delete(fundAProjectTags)
          .where(eq(fundAProjectTags.fundAProjectId, data.id))
        if (uniqueTagIds.length > 0) {
          await assertAllTagIdsExist(uniqueTagIds)
          await tx.insert(fundAProjectTags).values(
            uniqueTagIds.map((tagId) => ({
              fundAProjectId: data.id,
              tagId,
            })),
          )
        }
      }
    })

    return loadFundAProjectWithJoins(data.id)
  })
