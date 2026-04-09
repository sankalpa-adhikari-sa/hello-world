import { createServerFn } from '@tanstack/react-start'
import { queryOptions } from '@tanstack/react-query'
import {
  and,
  asc,
  desc,
  eq,
  exists,
  ilike,
  inArray,
  isNull,
  or,
} from 'drizzle-orm'
import { z } from 'zod'

import { db } from '@/db'
import { events, organizationEventTags } from '@/db/schema/organization.schema'

type EventRow = typeof events.$inferSelect
type EventWithJoins = EventRow & {
  organization: { id: string; name: string }
  organizationEventTags: Array<{ tag: { id: string; name: string } }>
}

export type PublicEvent = EventRow & {
  organization: { id: string; name: string }
  tags: Array<{ id: string; name: string }>
}

function toPublicEvent(row: EventWithJoins): PublicEvent {
  const { organizationEventTags: junction, organization, ...base } = row
  return {
    ...base,
    organization,
    tags: junction.map((j) => ({ id: j.tag.id, name: j.tag.name })),
  }
}

function isPublicEventCondition() {
  return or(isNull(events.isPublic), eq(events.isPublic, true))!
}

async function loadPublicEventById(id: string): Promise<PublicEvent | null> {
  const row = await db.query.events.findFirst({
    where: and(eq(events.id, id), isPublicEventCondition()),
    with: {
      organization: true,
      organizationEventTags: { with: { tag: true } },
    },
  })
  return row ? toPublicEvent(row) : null
}

export const getPublicEventByIdInputSchema = z.object({
  id: z.uuid(),
})

/**
 * Loads a single org calendar event when it is public (`is_public` true or null).
 * Public (no auth).
 */
export const getPublicEventById = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) => getPublicEventByIdInputSchema.parse(data))
  .handler(async ({ data }) => loadPublicEventById(data.id))

export const getPublicEventByIdQO = (id: string) =>
  queryOptions({
    queryKey: ['public-event', id],
    queryFn: () => getPublicEventById({ data: { id } }),
  })

export const getPublicEventsInputSchema = z.object({
  limit: z.number().min(1).max(100).default(48),
  searchParam: z
    .object({
      query: z.string().optional(),
      /** Sort by event start time */
      sortBy: z.enum(['asc', 'desc']).optional(),
      /** Match any of these `events.event_type` values (exact, case-sensitive as stored). */
      eventTypes: z.array(z.string().min(1)).max(20).optional(),
      tagIds: z.array(z.uuid()).max(50).optional(),
      featuredOnly: z.boolean().optional(),
    })
    .optional(),
})

export type GetPublicEventsInput = z.infer<typeof getPublicEventsInputSchema>

/**
 * Lists public org events with optional title/subtitle search, `event_type` filter,
 * tag filter (any match), optional featured-only, sorted by `start_date`.
 * Public (no auth).
 */
export const getPublicEvents = createServerFn({ method: 'GET' })
  .inputValidator((data: unknown) =>
    getPublicEventsInputSchema.parse(
      data === undefined || data === null ? {} : data,
    ),
  )
  .handler(async ({ data }) => {
    const limit = data.limit
    const q = data.searchParam?.query
    const sortBy = data.searchParam?.sortBy ?? 'asc'
    const eventTypes = data.searchParam?.eventTypes?.filter(Boolean)
    const tagIds = data.searchParam?.tagIds?.filter(Boolean)
    const featuredOnly = data.searchParam?.featuredOnly === true

    const filters = [isPublicEventCondition()]

    if (q?.trim()) {
      const pattern = `%${q.trim()}%`
      filters.push(
        or(ilike(events.title, pattern), ilike(events.subtitle, pattern))!,
      )
    }
    if (eventTypes?.length) {
      filters.push(inArray(events.eventType, eventTypes))
    }
    if (featuredOnly) {
      filters.push(eq(events.isFeatured, true))
    }
    if (tagIds?.length) {
      filters.push(
        exists(
          db
            .select()
            .from(organizationEventTags)
            .where(
              and(
                eq(organizationEventTags.eventId, events.id),
                inArray(organizationEventTags.tagId, tagIds),
              ),
            ),
        ),
      )
    }

    const rows = await db.query.events.findMany({
      where: and(...filters),
      orderBy:
        sortBy === 'desc' ? desc(events.startDate) : asc(events.startDate),
      limit,
      with: {
        organization: true,
        organizationEventTags: { with: { tag: true } },
      },
    })

    return rows.map(toPublicEvent)
  })

export const getPublicEventsQO = (
  input: Partial<GetPublicEventsInput> = {},
) => {
  const parsed = getPublicEventsInputSchema.parse(input)
  return queryOptions({
    queryKey: ['public-events', parsed],
    queryFn: () => getPublicEvents({ data: parsed }),
  })
}
