import { Pencil } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Meter, MeterLabel, MeterValue } from '@/components/ui/meter'

export interface FundmeCardProps {
  badge: string
  name: string
  dept: string
  title: string
  progress: number
  target: number
  imageUrl?: string
  imageAlt?: string
  imagePlaceholderText?: string
  onCardClick?: () => void
  onEdit?: () => void
  onViewDetails?: () => void
}

export interface FundMeMinimalCardProps {
  fundedPercent: number
  raisedAmount: number
  targetAmount: number
  fundedMeterLabel?: string
  raisedLabel?: string
  targetLabel?: string
}

export function FundmeCard({
  badge,
  name,
  dept,
  title,
  progress,
  target,
  imagePlaceholderText = '',
  imageUrl,
  imageAlt,
  onCardClick,
  onEdit,
  onViewDetails,
}: FundmeCardProps) {
  const coverAlt = imageAlt?.trim() || title
  return (
    <Card
      className="flex h-full cursor-pointer flex-col border-2 border-border pt-0 shadow-sm"
      onClick={onCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onCardClick?.()
        }
      }}
    >
      <CardHeader className="p-0 relative h-68 border-b-2 border-border bg-muted flex items-center justify-center overflow-hidden space-y-0">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={coverAlt}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 z-0 size-full object-cover grayscale"
          />
        ) : (
          <>
            <div className="absolute inset-0 bg-gray-200 grayscale opacity-50 mix-blend-multiply" />
            {imagePlaceholderText ? (
              <span className="relative z-10 font-mono text-muted-foreground">
                {imagePlaceholderText}
              </span>
            ) : null}
          </>
        )}

        <Badge className="absolute top-3 right-3 z-10 bg-primary text-primary-foreground border-2 border-border px-2 py-0.5 text-xs font-bold uppercase tracking-widest shadow-2xs rounded-none hover:bg-primary">
          {badge}
        </Badge>
        {onEdit ? (
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="absolute top-3 left-3 z-10 size-7"
            aria-label="Edit campaign"
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
          >
            <Pencil className="size-3.5" />
          </Button>
        ) : null}
      </CardHeader>

      <CardContent className="p-5 flex flex-col flex-grow">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="w-8 h-8 rounded-none after:rounded-none border-2 border-border shadow-2xs">
            <AvatarFallback className="bg-blue-200 text-[10px] font-bold rounded-none">
              {name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-tight">
              {name}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase">
              {dept}
            </span>
          </div>
        </div>

        <h3 className="font-sans font-bold text-lg leading-tight uppercase mb-6 flex-grow">
          {title}
        </h3>

        <div className="relative mb-4">
          <Progress
            value={progress}
            className="h-7 flex flex-col gap-0 overflow-hidden border-2 border-border bg-background shadow-2xs rounded-none"
            trackClassName="h-full min-h-0 rounded-none"
          />
          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold mix-blend-difference text-white pointer-events-none">
            {progress}% FUNDED
          </div>
        </div>
      </CardContent>

      <CardFooter className="px-5 pb-5 pt-0 flex justify-between items-end mt-auto">
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
            Target Goal
          </span>
          <span className="font-mono font-bold text-lg leading-none">
            ${target.toLocaleString()}
          </span>
        </div>

        <Button
          variant="outline"
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onViewDetails?.()
          }}
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  )
}

export function FundMeMinimalCard({
  fundedPercent,
  raisedAmount,
  targetAmount,
  fundedMeterLabel = 'Funded',
  raisedLabel = 'Raised',
  targetLabel = 'Target',
}: FundMeMinimalCardProps) {
  const pct = Math.min(Math.max(fundedPercent, 0), 100)

  return (
    <Card className="border-2 shadow-sm">
      <CardContent>
        <Meter className="mx-auto w-48" value={pct}>
          <div className="flex items-center justify-between">
            <MeterValue />
            <MeterLabel>{fundedMeterLabel}</MeterLabel>
          </div>
        </Meter>
        <div className="flex flex-row items-center justify-between">
          <div className="flex flex-col">
            <span>{raisedLabel}</span>
            <span className="font-bold text-lg">
              ${raisedAmount.toLocaleString()}
            </span>
          </div>
          <div className="flex flex-col">
            <span>{targetLabel}</span>
            <span className="font-bold text-lg">
              ${targetAmount.toLocaleString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
