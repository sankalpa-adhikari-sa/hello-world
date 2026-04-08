import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { REQUEST_TYPE } from '@/constants/enums'
import type { RequestCardProps } from '@/types/requests'
import { ZapIcon } from 'lucide-react'

export type { RequestCardProps } from '@/types/requests'

function requestTypeLabel(value: RequestCardProps['requestType']) {
  return REQUEST_TYPE.find((t) => t.value === value)?.label ?? value
}

export function RequestCard({
  id: _id,
  title,
  description,
  requestType,
  tags,
  isOpen,
  fulfillLabel = 'Fulfill Request',
  detailsLabel = 'View Details',
  editLabel = 'Edit',
  onFulfillClick,
  onDetailsClick,
  onEditClick,
}: RequestCardProps) {
  const typeLabel = requestTypeLabel(requestType)

  return (
    <Card className="shadow-sm border-2 border-border">
      <CardHeader className="space-y-2 pb-2">
        <div className="flex justify-between items-center">
          <Badge
            variant={'secondary'}
            className="rounded-none font-bold uppercase tracking-wider"
          >
            {typeLabel}
          </Badge>
          <span className="font-black uppercase tracking-tighter text-primary">
            {isOpen ? 'Open Request' : 'Closed Request'}
          </span>
        </div>

        <CardTitle className="text-2xl font-black leading-tight uppercase tracking-tighter">
          {title}
        </CardTitle>
        <div className="flex flex-row flex-wrap gap-2">
          {tags.map((tag, index) => (
            <Badge
              key={`${tag}-${index}`}
              variant={'outline'}
              className="rounded-none font-bold uppercase tracking-wider"
            >
              {tag}
            </Badge>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        <p className="text-sm font-medium leading-relaxed max-w-[95%]">
          {description}
        </p>
      </CardContent>

      <CardFooter className="flex flex-wrap items-end justify-between gap-3 pt-2">
        <Button
          size={'lg'}
          className="uppercase font-black text-base tracking-tight cursor-pointer"
          type="button"
          onClick={onFulfillClick}
        >
          {fulfillLabel} <ZapIcon />
        </Button>

        <div className="flex flex-wrap gap-2">
          {onEditClick ? (
            <Button
              variant={'secondary'}
              size={'lg'}
              className="uppercase font-black text-base tracking-tight cursor-pointer"
              type="button"
              onClick={onEditClick}
            >
              {editLabel}
            </Button>
          ) : null}
          <Button
            variant={'outline'}
            size={'lg'}
            className="uppercase font-black text-base tracking-tight cursor-pointer"
            type="button"
            onClick={onDetailsClick}
          >
            {detailsLabel}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
