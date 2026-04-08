import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'

import type { PublicEvent } from '@/sfn/events'
import EventsBanner from '@/components/core/events/events_banner'
import {
  EventFeaturedCard1,
  EventFeaturedCard2,
  EventFeaturedCard3,
  EventFeaturedCard4,
  OngoingEvents,
} from '@/components/core/events/events_card'
import { Button } from '@/components/ui/button'

import { getPublicEvents } from '@/sfn/events'

export const Route = createFileRoute('/_public/events')({
  component: RouteComponent,
})

function asDate(d: Date | string): Date {
  return d instanceof Date ? d : new Date(d)
}

function eventContent(e: PublicEvent): Record<string, unknown> {
  return (e.content ?? {}) as Record<string, unknown>
}

function str(c: Record<string, unknown>, key: string, fallback = ''): string {
  const v = c[key]
  return typeof v === 'string' ? v : fallback
}

function isOngoingEvent(e: PublicEvent, now: number): boolean {
  const start = asDate(e.startDate).getTime()
  const end = e.endDate ? asDate(e.endDate).getTime() : Number.POSITIVE_INFINITY
  return start <= now && end >= now
}

type CardVariant = 'gridLarge' | 'compact' | 'lecture' | 'hero'

function pickVariant(e: PublicEvent, index: number): CardVariant {
  const v = str(eventContent(e), 'cardVariant')
  if (v === 'compact' || v === 'lecture' || v === 'hero' || v === 'gridLarge') {
    return v
  }
  return (['gridLarge', 'compact', 'lecture', 'hero'] as const)[index % 4]
}

function formatShortDate(d: Date | string): string {
  const x = asDate(d)
  return x.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })
}

function formatTime(d: Date | string): string {
  return asDate(d).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDateTimeLine(e: PublicEvent): string {
  const start = asDate(e.startDate)
  const line = start
    .toLocaleString(undefined, {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
    .toUpperCase()
  return line
}

function RouteComponent() {
  const getPublicEventsSfn = useServerFn(getPublicEvents)

  const {
    data: events = [],
    isPending,
    isError,
  } = useQuery({
    queryKey: ['public-events', 'list', { limit: 48 }],
    queryFn: () => getPublicEventsSfn({ data: { limit: 48 } }),
  })

  const now = Date.now()
  const ongoing = events.filter((e) => isOngoingEvent(e, now))
  const ongoingFirst = ongoing[0]

  const featuredOrdered = [
    ...events.filter((e) => e.isFeatured),
    ...events.filter((e) => !e.isFeatured),
  ].slice(0, 4)

  return (
    <div>
      <EventsBanner />
      <article className="p-3 lg:p-6 space-y-4">
        <div className="flex flex-row flex-wrap gap-4">
          <Button className={'cursor-pointer'}>All Events</Button>
          <Button className={'cursor-pointer'} variant={'outline'}>
            Seminars
          </Button>
          <Button className={'cursor-pointer'} variant={'outline'}>
            Conferences
          </Button>
          <Button className={'cursor-pointer'} variant={'outline'}>
            Hakathons
          </Button>
          <Button className={'cursor-pointer'} variant={'outline'}>
            Open House
          </Button>
        </div>

        <div className="border-b-3 flex flex-row items-center justify-between pb-2">
          <h1 className="text-lg font-bold uppercase">Ongoing & Pop-up</h1>
          <span className="text-primary font-bold text-lg">
            ({isPending ? '…' : ongoing.length})
          </span>
        </div>

        {isPending ? (
          <p className="text-muted-foreground text-sm">Loading events…</p>
        ) : null}
        {isError ? (
          <p className="text-destructive text-sm">
            Could not load events. Try again later.
          </p>
        ) : null}

        {!isPending && !isError && events.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No public events yet. Check back soon.
          </p>
        ) : null}

        {ongoingFirst ? (
          <OngoingEvents
            dateLabel={formatShortDate(ongoingFirst.startDate)}
            title={ongoingFirst.title}
            description={
              ongoingFirst.subtitle?.trim() ||
              ongoingFirst.organization.name ||
              'Event'
            }
            timeRange={`${formatTime(ongoingFirst.startDate)}${
              ongoingFirst.endDate
                ? ` – ${formatTime(ongoingFirst.endDate)}`
                : ''
            }`}
          />
        ) : !isPending && !isError && events.length > 0 ? (
          <p className="text-muted-foreground text-sm">
            No events running right now. Browse featured below.
          </p>
        ) : null}

        <div className="grid grid-cols-3 gap-4">
          {/** Fixed mosaic: wide + narrow / narrow + wide (same as previous static layout). */}
          {(
            [
              [0, 'col-span-2'],
              [1, ''],
              [2, ''],
              [3, 'col-span-2'],
            ] as const
          ).map(([slotIndex, colClass]) => {
            const e = featuredOrdered[slotIndex]
            if (!e) return null
            const c = eventContent(e)
            const variant = pickVariant(e, slotIndex)
            const imageUrl =
              typeof c.imageUrl === 'string' ? c.imageUrl : undefined
            const description =
              e.subtitle?.trim() || e.organization.name || 'Details to come.'

            const wrap = (node: ReactNode) => (
              <div key={e.id} className={colClass || undefined}>
                {node}
              </div>
            )

            if (variant === 'compact') {
              return wrap(
                <EventFeaturedCard2
                  cornerBadge={
                    str(c, 'cornerBadge') ||
                    e.eventType.slice(0, 8).toUpperCase()
                  }
                  imageUrl={imageUrl}
                  title={e.title}
                  description={description}
                  dateLabel={formatShortDate(e.startDate)}
                  timeLabel={formatTime(e.startDate)}
                />,
              )
            }
            if (variant === 'lecture') {
              return wrap(
                <EventFeaturedCard3
                  categoryLabel={
                    str(c, 'categoryLabel') || e.eventType.toUpperCase()
                  }
                  title={e.title}
                  description={description}
                  locationScheduleLine={
                    str(c, 'locationScheduleLine') ||
                    `📍 ${e.location ?? e.organization.name}\n${formatDateTimeLine(e)}`
                  }
                />,
              )
            }
            if (variant === 'hero') {
              return wrap(
                <EventFeaturedCard4
                  imageUrl={imageUrl}
                  title={e.title}
                  tagline={
                    str(c, 'tagline') ||
                    `${e.organization.name} · ${e.eventType}`
                  }
                  dateRange={
                    str(c, 'dateRange') ||
                    (e.endDate
                      ? `${formatShortDate(e.startDate)} – ${formatShortDate(e.endDate)}`
                      : formatShortDate(e.startDate))
                  }
                />,
              )
            }
            return wrap(
              <EventFeaturedCard1
                imageUrl={imageUrl}
                seriesLabel={str(c, 'seriesLabel') || e.eventType.toUpperCase()}
                codeBadge={
                  str(c, 'codeBadge') ||
                  e.organization.name.slice(0, 12).toUpperCase()
                }
                title={e.title}
                description={description}
                dateTimeLabel={formatDateTimeLine(e)}
                locationLabel={e.location ?? e.organization.name}
              />,
            )
          })}
        </div>
      </article>
    </div>
  )
}
