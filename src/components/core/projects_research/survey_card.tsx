import { CoinsIcon, UsersIcon } from 'lucide-react'
import type { SurveyCardProps } from '@/types/survey'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export type { SurveyCardProps } from '@/types/survey'

export function SurveyCard({
  categoryBadge,
  endsInLabel,
  title,
  description,
  participantsCurrent,
  participantsGoal,
  rewardAmount,
  rewardCurrency = 'PUNK',
  takeSurveyLabel = 'Take Survey',
  onTakeSurveyClick,
}: SurveyCardProps) {
  return (
    <Card className="shadow-sm border-2 border-border">
      <CardHeader className="space-y-4 pb-2">
        <div className="flex justify-between items-center">
          <Badge className="rounded-none font-bold uppercase tracking-wider">
            {categoryBadge}
          </Badge>
          <span className="font-black uppercase tracking-tighter">
            Ends in: {endsInLabel}
          </span>
        </div>

        <CardTitle className="text-2xl font-black leading-tight uppercase tracking-tighter">
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <p className="text-sm font-medium leading-relaxed max-w-[90%]">
          {description}
        </p>
      </CardContent>

      <CardFooter className="flex justify-between items-end pt-2">
        <div className="flex gap-4 font-bold text-sm">
          <div className="flex items-center gap-1.5">
            <UsersIcon className="size-4 stroke-3" />
            <span>
              {participantsCurrent}/{participantsGoal}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <CoinsIcon className="size-4 stroke-3" />
            <span>
              {rewardAmount} {rewardCurrency}
            </span>
          </div>
        </div>

        <Button
          variant={'outline'}
          size={'lg'}
          className="uppercase font-black text-base tracking-tight cursor-pointer"
          type="button"
          onClick={onTakeSurveyClick}
        >
          {takeSurveyLabel}
        </Button>
      </CardFooter>
    </Card>
  )
}

export default SurveyCard
