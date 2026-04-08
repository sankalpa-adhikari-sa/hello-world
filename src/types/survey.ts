import { z } from 'zod'

const baseResearchSchema = z.object({
  title: z.string(),
  subititle: z.string().nullish(),
  content: z.any().nullish(),
  surveyLink: z.url(),
  surveyDeadline: z.date(),
})

export const researchInputSchema = baseResearchSchema

export const researchOutputSchema = baseResearchSchema.extend({
  id: z.uuid(),
  createdAt: z.date(),
  isFeatured: z.boolean(),
  updatedAt: z.date().nullable(),
  createdById: z.uuid(),
})

export const researchFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subititle: z.string().nullish(),
  content: z.any().nullish(),
  surveyLink: z.url(),
  surveyDeadline: z.coerce.date(),
})

export type ResearchInput = z.infer<typeof researchInputSchema>
export type ResearchOutput = z.infer<typeof researchOutputSchema>
export type ResearchFormValues = z.infer<typeof researchFormSchema>

export interface SurveyCardProps {
  categoryBadge: string
  endsInLabel: string
  title: string
  description: string
  participantsCurrent: number
  participantsGoal: number
  rewardAmount: string
  rewardCurrency?: string
  takeSurveyLabel?: string
  onTakeSurveyClick?: () => void
}
