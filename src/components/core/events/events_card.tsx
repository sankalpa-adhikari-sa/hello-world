import { CalendarIcon } from 'lucide-react'
import type {
  EventFeaturedCompactProps,
  EventFeaturedGridLargeProps,
  EventFeaturedHeroProps,
  EventFeaturedLectureProps,
  OngoingEventCardProps,
} from '@/types/events'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item'

export function OngoingEvents({
  dateLabel,
  title,
  description,
  timeRange,
  joinLabel = 'Join',
  onJoinClick,
}: OngoingEventCardProps) {
  return (
    <Item variant={'outline'} className="border border-border shadow-sm">
      <ItemMedia className="items-center">
        <CalendarIcon className="size-5 text-primary stroke-2.5" />
        <span className="text-xl font-bold italic text-primary">
          {dateLabel}
        </span>
      </ItemMedia>
      <ItemContent>
        <ItemTitle className="text-lg font-bold uppercase">{title}</ItemTitle>
        <ItemDescription className="first-letter:capitalize">
          {description}
        </ItemDescription>
      </ItemContent>
      <ItemActions className="gap-4">
        {timeRange}
        <Button
          variant={'outline'}
          size={'lg'}
          className={'font-semibold'}
          type="button"
          onClick={onJoinClick}
        >
          {joinLabel}
        </Button>
      </ItemActions>
    </Item>
  )
}

export function EventFeaturedCard1({
  featuredBadge = 'FEATURED',
  mediaTitle = '',
  mediaSubtitle = '',
  imageUrl,
  seriesLabel,
  codeBadge,
  title,
  description,
  dateTimeLabel,
  locationLabel,
  rsvpLabel = 'RSVP NOW',
  onRsvpClick,
}: EventFeaturedGridLargeProps) {
  return (
    <Item
      variant={'outline'}
      className="grid grid-cols-2 divide-x divide-border overflow-hidden border border-border shadow-sm"
    >
      <ItemMedia className="relative flex h-full min-h-52 items-center justify-center overflow-hidden bg-muted">
        <Badge className="absolute left-4 top-4 z-10 border-border/60 bg-primary px-2.5 py-1 text-[10px] font-medium tracking-[0.15em] text-primary-foreground uppercase">
          {featuredBadge}
        </Badge>

        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 z-0 size-full object-cover grayscale"
          />
        ) : (
          <div className="px-6 text-center">
            {mediaTitle ? (
              <p className="font-serif text-3xl font-normal italic leading-tight tracking-tight text-foreground">
                {mediaTitle}
              </p>
            ) : null}
            {mediaSubtitle ? (
              <p className="mt-3 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {mediaSubtitle}
              </p>
            ) : null}
          </div>
        )}
      </ItemMedia>

      <ItemContent className="flex flex-col justify-between gap-8 bg-card p-8">
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <span className="text-[10px] font-medium uppercase leading-relaxed tracking-[0.18em] text-muted-foreground">
              {seriesLabel}
            </span>
            <Badge
              variant="outline"
              className="shrink-0 border-border/70 text-[10px] font-normal tracking-wider"
            >
              {codeBadge}
            </Badge>
          </div>

          <ItemTitle className="w-full min-w-0 font-serif text-2xl font-normal leading-snug tracking-tight text-foreground normal-case line-clamp-none">
            {title}
          </ItemTitle>

          <ItemDescription className="text-sm leading-relaxed text-muted-foreground first-letter:capitalize">
            {description}
          </ItemDescription>

          <div className="grid grid-cols-2 gap-6 border-t border-border/50 pt-5 text-xs">
            <div className="space-y-1.5">
              <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                Date / time
              </p>
              <p className="tabular-nums text-foreground">{dateTimeLabel}</p>
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                Location
              </p>
              <p className="text-foreground">{locationLabel}</p>
            </div>
          </div>
        </div>

        <ItemActions>
          <Button
            className="w-full font-medium"
            type="button"
            onClick={onRsvpClick}
          >
            {rsvpLabel}
          </Button>
        </ItemActions>
      </ItemContent>
    </Item>
  )
}

export function EventFeaturedCard2({
  cornerBadge,
  imageUrl,
  title,
  description,
  dateLabel,
  timeLabel,
  rsvpLabel = 'RSVP',
  onRsvpClick,
}: EventFeaturedCompactProps) {
  return (
    <Item
      variant={'outline'}
      className="flex flex-col overflow-hidden border border-border shadow-sm"
    >
      <ItemMedia className="relative aspect-[16/10] min-h-36 overflow-hidden bg-muted">
        <Badge className="absolute right-3 top-3 z-10 border-border/60 bg-card/95 px-2 py-0.5 text-[10px] font-medium tracking-wider text-foreground backdrop-blur-sm">
          {cornerBadge}
        </Badge>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 z-0 size-full object-cover grayscale"
          />
        ) : null}
      </ItemMedia>

      <ItemContent className="flex flex-1 flex-col justify-between gap-6 bg-card p-6">
        <div className="space-y-3">
          <ItemTitle className="w-full min-w-0 font-serif text-base font-normal leading-snug tracking-tight text-foreground normal-case line-clamp-none">
            {title}
          </ItemTitle>

          <ItemDescription className="text-xs leading-relaxed text-muted-foreground first-letter:capitalize">
            {description}
          </ItemDescription>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between border-t border-border/50 pt-4 text-xs tabular-nums text-muted-foreground">
            <span>{dateLabel}</span>
            <span>{timeLabel}</span>
          </div>

          <ItemActions>
            <Button
              variant="outline"
              className="w-full font-medium"
              type="button"
              onClick={onRsvpClick}
            >
              {rsvpLabel}
            </Button>
          </ItemActions>
        </div>
      </ItemContent>
    </Item>
  )
}

export function EventFeaturedCard3({
  categoryLabel,
  title,
  description,
  locationScheduleLine,
  ctaLabel = 'Secure Spot',
  onCtaClick,
}: EventFeaturedLectureProps) {
  return (
    <Item
      variant={'outline'}
      className="flex min-h-50 flex-col justify-between border border-border bg-card p-8 shadow-sm"
    >
      <ItemContent className="space-y-5">
        <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-primary">
          {categoryLabel}
        </div>

        <ItemTitle className="w-full min-w-0 font-serif text-xl font-normal leading-snug tracking-tight text-foreground normal-case line-clamp-none">
          {title}
        </ItemTitle>

        <ItemDescription className="text-sm leading-relaxed text-muted-foreground first-letter:capitalize">
          {description}
        </ItemDescription>

        <div className="border border-border/60 bg-muted/30 px-4 py-3 text-xs leading-relaxed text-foreground whitespace-pre-line">
          {locationScheduleLine}
        </div>
      </ItemContent>

      <ItemActions className="pt-2">
        <Button
          className="w-full font-medium"
          type="button"
          onClick={onCtaClick}
        >
          {ctaLabel}
        </Button>
      </ItemActions>
    </Item>
  )
}

export function EventFeaturedCard4({
  imageUrl,
  title,
  tagline,
  dateRange,
  ctaLabel = 'RSVP ALL SESSIONS',
  onCtaClick,
}: EventFeaturedHeroProps) {
  return (
    <Item
      variant={'outline'}
      className="flex flex-col overflow-hidden border border-border shadow-sm"
    >
      <ItemMedia className="relative aspect-[2.35/1] min-h-44 w-full shrink-0 overflow-hidden bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            loading="lazy"
            decoding="async"
            className="size-full object-cover grayscale"
          />
        ) : null}
      </ItemMedia>

      <ItemContent className="flex w-full flex-col gap-6 bg-card px-8 py-7 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl space-y-2">
          <ItemTitle className="w-full min-w-0 font-serif text-2xl font-normal leading-tight tracking-tight text-foreground normal-case line-clamp-none sm:text-3xl">
            {title}
          </ItemTitle>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-primary">
            {tagline}
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:items-end">
          <p className="text-xs tabular-nums tracking-wide text-muted-foreground">
            {dateRange}
          </p>
          <ItemActions>
            <Button
              variant="outline"
              className="font-medium"
              type="button"
              onClick={onCtaClick}
            >
              {ctaLabel}
            </Button>
          </ItemActions>
        </div>
      </ItemContent>
    </Item>
  )
}
