import { Link } from '@tanstack/react-router'
import { PlayCircle, Zap } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const heroButtonClass =
  'h-auto min-h-10 border-2 border-border px-6 py-3 text-sm font-bold uppercase tracking-wide shadow-sm transition-transform hover:-translate-y-0.5 active:translate-y-0 active:shadow-none'

export interface HeroSectionProps {
  archiveId?: string
  titleLine1?: string
  titleHighlight?: string
  titleLine2?: string
  description?: string
  /** Router path for primary CTA (default: fund-a-project index). */
  primaryTo?: string
  /** Router path for secondary CTA (default: research requests). */
  secondaryTo?: string
  className?: string
}

export default function LandingPageHero({
  archiveId = 'EST. 2024 / ARCHIVE 001',
  titleLine1 = 'Empower',
  titleHighlight = 'Student',
  titleLine2 = 'Innovation',
  description = 'Dismantle the financial barriers of high-tier academia. Direct funding for the next generation of intellectual rebels.',
  primaryTo = '/fund-a-project',
  secondaryTo = '/requests',
  className,
}: HeroSectionProps) {
  return (
    <header
      className={cn(
        'border-border bg-primary text-primary-foreground relative overflow-hidden border-b-2',
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 py-16 md:grid-cols-2 md:py-24">
        <div className="flex flex-col items-start">
          <Badge
            variant="outline"
            className="mb-8 rounded-none border-2 border-primary-foreground/30 bg-primary-foreground/10 px-3 py-1.5 text-[0.65rem] font-bold tracking-[0.2em] text-primary-foreground uppercase backdrop-blur-sm"
          >
            {archiveId}
          </Badge>

          <h1 className="mb-6 text-5xl leading-[0.9] font-black tracking-tighter uppercase sm:text-6xl md:text-7xl lg:text-8xl">
            {titleLine1}
            <br />
            <span className="text-primary-foreground decoration-primary-foreground/40 underline decoration-4 underline-offset-4 italic">
              {titleHighlight}
            </span>
            <br />
            {titleLine2}
          </h1>

          <p className="mb-8 max-w-md text-base leading-snug font-medium text-primary-foreground/90 md:text-lg">
            {description}
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              to={primaryTo}
              className={cn(
                buttonVariants({ variant: 'default', size: 'lg' }),
                heroButtonClass,
                'gap-2 bg-primary-foreground text-primary hover:bg-primary-foreground/90',
              )}
            >
              Start a project
              <PlayCircle className="size-5 shrink-0" />
            </Link>
            <Link
              to={secondaryTo}
              className={cn(
                buttonVariants({ variant: 'outline', size: 'lg' }),
                heroButtonClass,
                'border-primary-foreground/40 bg-background/95 text-foreground hover:bg-background',
              )}
            >
              Browse archives
            </Link>
          </div>
        </div>

        <Card className="border-border bg-muted text-foreground relative z-10 min-h-[min(24rem,50vh)] overflow-visible rounded-none border-4 shadow-lg">
          <CardContent className="relative flex h-full min-h-[min(24rem,50vh)] items-center justify-center overflow-hidden p-0">
            <div className="absolute inset-0 bg-gradient-to-br from-muted via-muted/90 to-muted/70 grayscale" />
            <p className="relative z-[1] px-6 text-center font-mono text-sm font-bold text-muted-foreground uppercase select-none sm:text-base">
              [Hero image: students studying]
            </p>

            <Badge
              variant="default"
              className="border-border absolute -bottom-4 -left-4 z-20 rounded-none border-4 px-5 py-2.5 text-lg font-black italic tracking-tight uppercase shadow-md sm:-bottom-6 sm:-left-6 sm:px-6 sm:text-2xl"
            >
              Live now
            </Badge>

            <div className="border-border bg-primary absolute -right-4 -bottom-8 z-20 rounded-none border-4 p-3 shadow-md sm:-right-6 sm:-bottom-10">
              <Zap
                className="text-primary-foreground size-7 fill-current sm:size-8"
                aria-hidden
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </header>
  )
}
