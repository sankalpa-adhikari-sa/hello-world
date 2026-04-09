import { z } from 'zod'

export const baseTagsSchema = z.object({
  name: z.string().min(1, 'Name is required').max(120),
  isPublic: z.boolean().nullish().default(false),
})

export const tagsInputSchema = baseTagsSchema
export const tagsOutputSchema = baseTagsSchema.extend({
  id: z.uuid(),
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
  createdById: z.uuid(),
})
export const tagsMinimalSchema = baseTagsSchema.extend({
  id: z.uuid(),
})
export type TagsMinimal = z.infer<typeof tagsMinimalSchema>
export type TagsInput = z.infer<typeof tagsInputSchema>
export type TagsOutput = z.infer<typeof tagsOutputSchema>
