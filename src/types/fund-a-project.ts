import { z } from 'zod'
import type { JSONContent } from '@tiptap/core'

import {
  asRichTextContent,
  emptyRichTextDocument,
} from '@/lib/tiptap-empty-doc'

export const fundProjectLevelSchema = z.enum([
  'highschool',
  'undergrad',
  'grad',
])
export type FundProjectLevel = z.infer<typeof fundProjectLevelSchema>

export const FUND_PROJECT_LEVEL_LABEL: Record<FundProjectLevel, string> = {
  highschool: 'High school',
  undergrad: 'Undergrad',
  grad: 'Grad',
}

export const FUND_PROJECT_LEVEL_KEYS = [
  'highschool',
  'undergrad',
  'grad',
] as const satisfies ReadonlyArray<FundProjectLevel>

const baseFundAProjectSchema = z.object({
  title: z.string(),
  subititle: z.string().nullish(),
  subtitle: z.string().nullish(),
  content: z.any().nullish(),
  targetAmount: z.number().int(),
  fundedAmount: z.number().int(),
  projectLevel: fundProjectLevelSchema,
  coverImageUrl: z.string().nullish(),
  coverImageAlt: z.string().nullish(),
})

export const fundAProjectInputSchema = baseFundAProjectSchema

export const fundAProjectOutputSchema = baseFundAProjectSchema.extend({
  id: z.uuid(),
  createdAt: z.date(),
  isFeatured: z.boolean(),
  updatedAt: z.date().nullable(),
  createdById: z.uuid(),
})

export const fundAProjectFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subititle: z.string().nullish(),
  subtitle: z.string().nullish(),
  content: z.any().nullish(),
  targetAmount: z.coerce.number().int().min(1, 'Target must be at least 1'),
  fundedAmount: z.coerce
    .number()
    .int()
    .min(0, 'Funded amount cannot be negative'),
  projectLevel: fundProjectLevelSchema,
  coverImageUrl: z.string().nullish(),
  coverImageAlt: z.string().nullish(),
})

/** TipTap JSON under `content.story`. */
const fundProjectStoryField = z
  .any()
  .refine(
    (v): v is JSONContent =>
      v !== null &&
      typeof v === 'object' &&
      !Array.isArray(v) &&
      (v as JSONContent).type === 'doc',
    { message: 'Add details in the editor (document body is required).' },
  )

export const fundAProjectCreateFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().optional(),
  targetAmount: z.number().int().min(1, 'Target must be at least 1'),
  fundedAmount: z.number().int().min(0, 'Funded amount cannot be negative'),
  projectLevel: fundProjectLevelSchema,
  coverImageUrl: z.string().optional(),
  coverImageAlt: z.string().optional(),
  story: fundProjectStoryField,
  tagIds: z.array(z.string().uuid()),
})

export type FundAProjectInput = z.infer<typeof fundAProjectInputSchema>
export type FundAProjectOutput = z.infer<typeof fundAProjectOutputSchema>
export type FundAProjectFormValues = z.infer<typeof fundAProjectFormSchema>
export type FundAProjectCreateFormValues = z.infer<
  typeof fundAProjectCreateFormSchema
>

export function buildFundAProjectPayloadContent(
  v: Pick<FundAProjectCreateFormValues, 'story'>,
): Record<string, unknown> {
  return { story: v.story }
}

export function extractFundAProjectStory(raw: unknown): JSONContent {
  if (raw !== null && typeof raw === 'object' && !Array.isArray(raw)) {
    const o = raw as Record<string, unknown>
    if (o.story !== undefined) {
      return asRichTextContent(o.story)
    }
  }
  return asRichTextContent(raw)
}

/** Legacy rows may still store a cover image under `content.imageUrl`. */
export function extractLegacyFundAProjectCoverImageUrl(raw: unknown): string {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return ''
  }
  const v = (raw as Record<string, unknown>).imageUrl
  return typeof v === 'string' ? v : ''
}

export function defaultFundAProjectCreateFormValues(): FundAProjectCreateFormValues {
  return {
    title: '',
    subtitle: '',
    targetAmount: 1000,
    fundedAmount: 0,
    projectLevel: 'undergrad',
    coverImageUrl: '',
    coverImageAlt: '',
    story: emptyRichTextDocument,
    tagIds: [],
  }
}

export interface FundmeCardProps {
  badge: string
  name: string
  dept: string
  title: string
  progress: number
  target: number
  /** Shown in the header when `imageUrl` is not set */
  imagePlaceholderText?: string
  /** Cover image for the card header; displayed in grayscale */
  imageUrl?: string | null
  /** Accessible description for the cover image */
  imageAlt?: string
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
