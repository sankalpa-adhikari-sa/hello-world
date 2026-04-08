export interface OngoingEventCardProps {
  dateLabel: string
  title: string
  description: string
  timeRange: string
  joinLabel?: string
  onJoinClick?: () => void
}

export interface EventFeaturedGridLargeProps {
  featuredBadge?: string
  /** Typography block in the media column when `imageUrl` is not set */
  mediaTitle?: string
  mediaSubtitle?: string
  /** Cover image for the left media column; shown in grayscale */
  imageUrl?: string | null
  seriesLabel: string
  codeBadge: string
  title: string
  description: string
  dateTimeLabel: string
  locationLabel: string
  rsvpLabel?: string
  onRsvpClick?: () => void
}

export interface EventFeaturedCompactProps {
  cornerBadge: string
  /** Cover image for the top strip; shown in grayscale */
  imageUrl?: string | null
  title: string
  description: string
  dateLabel: string
  timeLabel: string
  rsvpLabel?: string
  onRsvpClick?: () => void
}

export interface EventFeaturedLectureProps {
  categoryLabel: string
  title: string
  description: string
  locationScheduleLine: string
  ctaLabel?: string
  onCtaClick?: () => void
}

export interface EventFeaturedHeroProps {
  /** Full-bleed background image; shown in grayscale */
  imageUrl?: string | null
  title: string
  tagline: string
  dateRange: string
  ctaLabel?: string
  onCtaClick?: () => void
}
