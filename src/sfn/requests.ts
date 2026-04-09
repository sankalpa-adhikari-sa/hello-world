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
} from 'drizzle-orm'
import { z } from 'zod'

import { getCurrentUser } from './users'
import { REQUEST_TYPE } from '@/constants/enums'
import { db } from '@/db'
import { request, requestTags } from '@/db/schema/request.schema'
import { tags } from '@/db/schema/tags.schema'

export const getRequestById = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.uuid(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    return loadRequestWithTags(data.id)
  })

export const getRequestByIdQO = (id: string) =>
  queryOptions({
    queryKey: ['request', id],
    queryFn: () => getRequestById({ data: { id } }),
  })

export const listTagsForRequestsForm = createServerFn({
  method: 'GET',
}).handler(async () => {
  const rows = await db.query.tags.findMany({
    orderBy: asc(tags.name),
    limit: 500,
  })
  return rows.map((r) => ({ id: r.id, name: r.name }))
})

export const listTagsForRequestsFormQO = () =>
  queryOptions({
    queryKey: ['tags', 'request-form'],
    queryFn: () => listTagsForRequestsForm(),
  })

const requestTypeEnum = z.enum(
  REQUEST_TYPE.map((g) => g.value) as [string, ...Array<string>],
)

type RequestRow = typeof request.$inferSelect
export type RequestWithTags = RequestRow & {
  tags: Array<{ id: string; name: string }>
}

export type GetRequestsResult = {
  items: Array<RequestWithTags>
  total: number
  page: number
  pageSize: number
}

function toRequestWithTags(
  row: RequestRow & {
    requestTags: Array<{ tag: { id: string; name: string } }>
  },
): RequestWithTags {
  const { requestTags: junction, ...base } = row
  return {
    ...base,
    tags: junction.map((rt) => ({ id: rt.tag.id, name: rt.tag.name })),
  }
}

async function loadRequestWithTags(
  id: string,
): Promise<RequestWithTags | null> {
  const row = await db.query.request.findFirst({
    where: eq(request.id, id),
    with: {
      requestTags: { with: { tag: true } },
    },
  })
  return row ? toRequestWithTags(row) : null
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

export const getRequestsInputSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(12),
  searchParam: z
    .object({
      query: z.string().optional(),
      sortBy: z.enum(['asc', 'desc']).optional(),
      tagIds: z.array(z.uuid()).max(50).optional(),
      requestTypes: z.array(requestTypeEnum).max(20).optional(),
    })
    .optional(),
})

export type GetRequestsInput = z.infer<typeof getRequestsInputSchema>

export const requestsPublicListSearchSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce.number().int().min(1).max(50).catch(12),
  q: z
    .string()
    .optional()
    .transform((s) => (s === '' || s === undefined ? undefined : s)),
  sort: z.enum(['asc', 'desc']).catch('desc'),
  tags: z
    .string()
    .optional()
    .transform((s) => (s === '' || s === undefined ? undefined : s)),
  types: z
    .string()
    .optional()
    .transform((s) => (s === '' || s === undefined ? undefined : s)),
})

export type RequestsPublicListSearch = z.infer<
  typeof requestsPublicListSearchSchema
>

export const getRequests = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) =>
    getRequestsInputSchema.parse(
      data === undefined || data === null ? {} : data,
    ),
  )
  .handler(async ({ data }): Promise<GetRequestsResult> => {
    const limit = data.limit
    const requestedPage = data.page
    const q = data.searchParam?.query
    const sortBy = data.searchParam?.sortBy ?? 'desc'
    const tagIds = data.searchParam?.tagIds?.filter(Boolean)
    const requestTypes = data.searchParam?.requestTypes?.filter(Boolean)

    const filters = []
    if (q?.trim()) {
      const pattern = `%${q.trim()}%`
      filters.push(
        or(ilike(request.title, pattern), ilike(request.subtitle, pattern))!,
      )
    }
    if (tagIds?.length) {
      filters.push(
        exists(
          db
            .select()
            .from(requestTags)
            .where(
              and(
                eq(requestTags.requestId, request.id),
                inArray(requestTags.tagId, tagIds),
              ),
            ),
        ),
      )
    }
    if (requestTypes?.length) {
      filters.push(inArray(request.requestType, requestTypes))
    }

    const whereClause = filters.length ? and(...filters) : undefined

    const [countRow] = await db
      .select({ total: count() })
      .from(request)
      .where(whereClause)

    const total = Number(countRow?.total ?? 0)
    const totalPages = Math.max(1, Math.ceil(total / limit))
    const page = Math.min(Math.max(1, requestedPage), totalPages)
    const offset = (page - 1) * limit

    const rows = await db.query.request.findMany({
      where: whereClause,
      orderBy:
        sortBy === 'asc' ? asc(request.createdAt) : desc(request.createdAt),
      limit,
      offset,
      with: {
        requestTags: { with: { tag: true } },
      },
    })

    return {
      items: rows.map(toRequestWithTags),
      total,
      page,
      pageSize: limit,
    }
  })

export const getRequestsQO = (input: Partial<GetRequestsInput> = {}) => {
  const parsed = getRequestsInputSchema.parse(input)
  return queryOptions({
    queryKey: ['requests', parsed],
    queryFn: () => getRequests({ data: parsed }),
  })
}

export const createRequestSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().nullish(),
  content: z.any().optional().default({}),
  requestType: requestTypeEnum,
  tagIds: z.array(z.uuid()).max(50).optional(),
})

export type CreateRequestInput = z.infer<typeof createRequestSchema>

export const createRequest = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => createRequestSchema.parse(data))
  .handler(async ({ data }) => {
    const { currentUser } = await getCurrentUser()
    const uniqueTagIds = data.tagIds?.length ? [...new Set(data.tagIds)] : []

    return await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(request)
        .values({
          title: data.title,
          subtitle: data.subtitle ?? null,
          content: data.content ?? {},
          requestType: data.requestType,
          createdById: currentUser.id,
        })
        .returning()

      if (!row) {
        throw new Error('Failed to create request')
      }

      if (uniqueTagIds.length > 0) {
        await assertAllTagIdsExist(uniqueTagIds)
        await tx.insert(requestTags).values(
          uniqueTagIds.map((tagId) => ({
            requestId: row.id,
            tagId,
          })),
        )
      }

      const full = await tx.query.request.findFirst({
        where: eq(request.id, row.id),
        with: { requestTags: { with: { tag: true } } },
      })
      return full
        ? toRequestWithTags(full)
        : toRequestWithTags({
            ...row,
            requestTags: [],
          })
    })
  })

export const updateRequestSchema = z.object({
  id: z.uuid(),
  title: z.string().min(1).optional(),
  subtitle: z.string().nullish().optional(),
  content: z.any().optional(),
  requestType: requestTypeEnum.optional(),
  tagIds: z.array(z.uuid()).max(50).optional(),
})

export type UpdateRequestInput = z.infer<typeof updateRequestSchema>

export const updateRequest = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => updateRequestSchema.parse(data))
  .handler(async ({ data }) => {
    const { currentUser } = await getCurrentUser()

    const existing = await db.query.request.findFirst({
      where: and(
        eq(request.id, data.id),
        eq(request.createdById, currentUser.id),
      ),
    })
    if (!existing) {
      return null
    }

    const patch: Partial<{
      title: string
      subtitle: string | null
      content: Record<string, unknown>
      requestType: (typeof REQUEST_TYPE)[number]['value']
    }> = {}

    if (data.title !== undefined) patch.title = data.title
    if (data.subtitle !== undefined) patch.subtitle = data.subtitle ?? null
    if (data.content !== undefined) patch.content = data.content
    if (data.requestType !== undefined) patch.requestType = data.requestType

    const hasPatch = Object.keys(patch).length > 0
    const hasTagUpdate = data.tagIds !== undefined

    if (!hasPatch && !hasTagUpdate) {
      return loadRequestWithTags(data.id)
    }

    const uniqueTagIds =
      data.tagIds !== undefined ? [...new Set(data.tagIds)] : []

    await db.transaction(async (tx) => {
      if (hasPatch) {
        await tx.update(request).set(patch).where(eq(request.id, data.id))
      }
      if (hasTagUpdate) {
        await tx.delete(requestTags).where(eq(requestTags.requestId, data.id))
        if (uniqueTagIds.length > 0) {
          await assertAllTagIdsExist(uniqueTagIds)
          await tx.insert(requestTags).values(
            uniqueTagIds.map((tagId) => ({
              requestId: data.id,
              tagId,
            })),
          )
        }
      }
    })

    return loadRequestWithTags(data.id)
  })

export const deleteRequest = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.uuid(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { currentUser } = await getCurrentUser()

    const [removed] = await db
      .delete(request)
      .where(
        and(eq(request.id, data.id), eq(request.createdById, currentUser.id)),
      )
      .returning({ id: request.id })

    return { deleted: Boolean(removed), id: removed?.id ?? null }
  })
