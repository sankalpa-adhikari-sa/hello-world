import { createServerFn } from '@tanstack/react-start'
import { queryOptions } from '@tanstack/react-query'
import { and, asc, eq, ilike, or } from 'drizzle-orm'
import { z } from 'zod'

import { getCurrentUser } from './users'
import { db } from '@/db'
import { tags } from '@/db/schema/tags.schema'


export const listTagsInputSchema = z.object({
  search: z.string().optional(),
  limit: z.number().min(1).max(200).default(100),
})

export type ListTagsInput = z.infer<typeof listTagsInputSchema>

/**
 * Tags you created or that are marked public. Authenticated.
 */
export const listTags = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) =>
    listTagsInputSchema.parse(data === undefined || data === null ? {} : data),
  )
  .handler(async ({ data }) => {
    const { currentUser } = await getCurrentUser()
    const search = data.search?.trim()

    const visibility = or(
      eq(tags.createdById, currentUser.id),
      eq(tags.isPublic, true),
    )!

    const conditions = [visibility]
    if (search) {
      conditions.push(ilike(tags.name, `%${search}%`))
    }

    const rows = await db.query.tags.findMany({
      where: and(...conditions),
      orderBy: asc(tags.name),
      limit: data.limit,
    })

    return rows.map((r) => ({
      ...r,
      canEdit: r.createdById === currentUser.id,
    }))
  })

export const listTagsQO = (input: Partial<ListTagsInput> = {}) => {
  const parsed = listTagsInputSchema.parse(input)
  return queryOptions({
    queryKey: ['tags', 'manage', parsed],
    queryFn: () => listTags({ data: parsed }),
  })
}

export const createTagSchema = z.object({
  name: z.string().min(1).max(120),
  isPublic: z.boolean().optional().default(false),
})

export const createTag = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => createTagSchema.parse(data))
  .handler(async ({ data }) => {
    const { currentUser } = await getCurrentUser()
    const [row] = await db
      .insert(tags)
      .values({
        name: data.name.trim(),
        isPublic: data.isPublic ?? false,
        createdById: currentUser.id,
      })
      .returning()
    return row
  })

export const updateTagSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(120).optional(),
  isPublic: z.boolean().optional(),
})

export const updateTag = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => updateTagSchema.parse(data))
  .handler(async ({ data }) => {
    const { currentUser } = await getCurrentUser()

    const patch: Partial<{ name: string; isPublic: boolean }> = {}
    if (data.name !== undefined) patch.name = data.name.trim()
    if (data.isPublic !== undefined) patch.isPublic = data.isPublic

    if (Object.keys(patch).length === 0) {
      const existing = await db.query.tags.findFirst({
        where: and(eq(tags.id, data.id), eq(tags.createdById, currentUser.id)),
      })
      return existing ?? null
    }

    const [updated] = await db
      .update(tags)
      .set(patch)
      .where(and(eq(tags.id, data.id), eq(tags.createdById, currentUser.id)))
      .returning()

    return updated ?? null
  })

export const deleteTagSchema = z.object({
  id: z.string().uuid(),
})

export const deleteTag = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => deleteTagSchema.parse(data))
  .handler(async ({ data }) => {
    const { currentUser } = await getCurrentUser()

    const [removed] = await db
      .delete(tags)
      .where(and(eq(tags.id, data.id), eq(tags.createdById, currentUser.id)))
      .returning({ id: tags.id })

    return { deleted: Boolean(removed), id: removed?.id ?? null }
  })
