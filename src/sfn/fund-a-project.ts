import { createServerFn } from '@tanstack/react-start'
import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { and, asc, count, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm'
import { z } from 'zod'

import { getCurrentUser } from './users'

import type {
  FundAProjectOutput,
  FundAPublicListSearch,
  FundProjectLevelValue,
  GetFundAProjectsInput,
  GetFundAProjectsResult,
} from '@/types/fund-a-project'
import { db } from '@/db'
import {
  fundAProject,
  fundAProjectTags,
} from '@/db/schema/fund_a_project.schema'
import { assertAllTagIdsExist } from '@/sfn/tags'
import {
  fundAProjectInputSchema,
  fundAProjectOutputSchema,
  getFundAProjectByIdInputSchema,
  getFundAProjectsInputSchema,
  updateFundAProjectInputSchema,
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

export const getFundAProjectById = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => getFundAProjectByIdInputSchema.parse(data))
  .handler(async ({ data }) => loadFundAProjectWithJoins(data.id))

export const getFundAProjectByIdQO = (id: string) =>
  queryOptions({
    queryKey: ['fund-a-project', id],
    queryFn: () => getFundAProjectById({ data: { id } }),
  })

const PROJECT_LEVEL_SET = new Set<FundProjectLevelValue>([
  'highschool',
  'undergrad',
  'grad',
])

function parseCommaList(raw: string | undefined): Array<string> {
  if (!raw?.trim()) return []
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export function parseFundAPublicLevelsFromSearch(
  search: FundAPublicListSearch,
): Array<FundProjectLevelValue> {
  const rawLevels = parseCommaList(search.levels)
  return rawLevels.filter((l) =>
    PROJECT_LEVEL_SET.has(l),
  )
}

export function parseFundAPublicTagIdsFromSearch(
  search: FundAPublicListSearch,
): Array<string> {
  return parseCommaList(search.tags).filter(
    (id) => z.uuid().safeParse(id).success,
  )
}

export function fundAPublicListHasActiveFilters(
  search: FundAPublicListSearch,
): boolean {
  if ((search.q ?? '').trim()) return true
  if (search.sort !== 'newest') return true
  if (search.featured === true) return true
  if (parseFundAPublicTagIdsFromSearch(search).length > 0) return true
  if (parseFundAPublicLevelsFromSearch(search).length > 0) return true
  return false
}

export function fundAPublicSearchToListInput(
  search: FundAPublicListSearch,
): GetFundAProjectsInput {
  const tagIds = parseFundAPublicTagIdsFromSearch(search)
  const projectLevels = parseFundAPublicLevelsFromSearch(search)

  return {
    page: search.page,
    limit: search.pageSize,
    searchParam: {
      query: search.q,
      sort: search.sort,
      tagIds: tagIds.length ? tagIds : undefined,
      projectLevels: projectLevels.length ? projectLevels : undefined,
      featuredOnly: search.featured === true ? true : undefined,
    },
  }
}

const urgencyOrderSql = sql`CASE WHEN ${fundAProject.targetAmount} > 0 THEN (${fundAProject.fundedAmount}::numeric / NULLIF(${fundAProject.targetAmount}, 0)) ELSE 1 END`

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
      const projectsWithAnyTag = db
        .select({ id: fundAProjectTags.fundAProjectId })
        .from(fundAProjectTags)
        .where(inArray(fundAProjectTags.tagId, tagIds))
      filters.push(inArray(fundAProject.id, projectsWithAnyTag))
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
    placeholderData: keepPreviousData,
  })
}

export const createFundAProject = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => fundAProjectInputSchema.parse(data))
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

export const updateFundAProject = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => updateFundAProjectInputSchema.parse(data))
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

    const uniqueTagIds = [...new Set(data.tagIds ?? [])]

    await db.transaction(async (tx) => {
      await tx
        .update(fundAProject)
        .set({
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
        })
        .where(eq(fundAProject.id, data.id))

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
    })

    return loadFundAProjectWithJoins(data.id)
  })
