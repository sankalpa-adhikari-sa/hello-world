import { z } from 'zod'
import { userProfileMinimalSchema } from './user'
import { tagsMinimalSchema } from './tags'
import { FUND_PROJECT_LEVEL } from '@/constants/enums'

const baseFundAProjectSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().nullish(),
  content: z.any().optional().default({}),
  targetAmount: z.coerce.number().int().min(1, 'Target must be at least 1'),
  fundedAmount: z.coerce
    .number()
    .int()
    .min(0, 'Funded amount cannot be negative'),
  projectLevel: z.enum(
    FUND_PROJECT_LEVEL.map((level) => level.value) as [
      string,
      ...Array<string>,
    ],
  ),
  coverImageUrl: z.string().nullish(),
  coverImageAlt: z.string().nullish(),
  tagIds: z.array(z.uuid()).max(50).optional(),
})

export const fundAProjectInputSchema = baseFundAProjectSchema

export const fundAProjectOutputSchema = baseFundAProjectSchema.extend({
  id: z.uuid(),
  createdAt: z.date(),
  isFeatured: z.boolean(),
  updatedAt: z.date().nullable(),
  createdById: z.uuid(),
  createdBy: userProfileMinimalSchema,
  tags: z.array(tagsMinimalSchema),
})

export type FundAProjectInput = z.infer<typeof fundAProjectInputSchema>
export type FundAProjectOutput = z.infer<typeof fundAProjectOutputSchema>

export const FUND_PROJECT_LEVEL_KEYS = FUND_PROJECT_LEVEL.map(
  (level) => level.value,
) as [string, ...Array<string>]

export const FUND_PROJECT_LEVEL_LABEL = Object.fromEntries(
  FUND_PROJECT_LEVEL.map((level) => [level.value, level.label]),
) as Record<string, string>

export type FundProjectLevel = (typeof FUND_PROJECT_LEVEL_KEYS)[number]
