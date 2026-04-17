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
  projectLevel: z
    .enum(
      FUND_PROJECT_LEVEL.map((level) => level.value) as [
        string,
        ...Array<string>,
      ],
    )
    .default('undergrad'),
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

export const updateFundAProjectInputSchema = fundAProjectInputSchema.extend({
  id: z.uuid(),
})
export type UpdateFundAProjectInput = z.infer<
  typeof updateFundAProjectInputSchema
>

export const getFundAProjectByIdInputSchema = z.object({
  id: z.uuid(),
})

export const getFundAProjectsInputSchema = z.object({
  /** 1-based page index */
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(12),
  searchParam: z
    .object({
      query: z.string().optional(),
      sort: z.enum(['newest', 'oldest', 'urgent']).optional(),
      tagIds: z.array(z.uuid()).max(50).optional(),
      /** When true, only rows with `isFeatured === true`. */
      featuredOnly: z.boolean().optional(),
      projectLevels: z
        .array(fundAProjectInputSchema.shape.projectLevel)
        .max(10)
        .optional(),
    })
    .optional(),
})

export type GetFundAProjectsInput = z.infer<typeof getFundAProjectsInputSchema>

export type GetFundAProjectsResult = {
  items: Array<FundAProjectOutput>
  total: number
  page: number
  pageSize: number
}

/** URL search params for `/_public/fund-a-project` */
export const fundAPublicListSearchSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce.number().int().min(1).max(50).catch(12),
  q: z
    .string()
    .optional()
    .transform((s) => (s === '' || s === undefined ? undefined : s)),
  sort: z.enum(['newest', 'oldest', 'urgent']).catch('newest'),
  tags: z
    .string()
    .optional()
    .transform((s) => (s === '' || s === undefined ? undefined : s)),
  levels: z
    .string()
    .optional()
    .transform((s) => (s === '' || s === undefined ? undefined : s)),
  featured: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((s) => {
      if (s === true || s === '1' || s === 'true') return true
      return undefined
    }),
})

export type FundAPublicListSearch = z.infer<typeof fundAPublicListSearchSchema>

/** Parsed defaults for links and `navigate` to `/_public/fund-a-project`. */
export const fundAPublicListDefaultSearch: FundAPublicListSearch =
  fundAPublicListSearchSchema.parse({})

export const FUND_PROJECT_LEVEL_KEYS = FUND_PROJECT_LEVEL.map(
  (level) => level.value,
) as [string, ...Array<string>]

export const FUND_PROJECT_LEVEL_LABEL = Object.fromEntries(
  FUND_PROJECT_LEVEL.map((level) => [level.value, level.label]),
) as Record<string, string>

export type FundProjectLevel = (typeof FUND_PROJECT_LEVEL_KEYS)[number]

/** Same union as `FundProjectLevel`; kept for call sites that used the Zod-inferred name. */
export type FundProjectLevelValue = FundProjectLevel
