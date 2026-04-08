import { z } from 'zod'

/** Shared fields for create / edit tag forms. */
export const tagFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(120),
  isPublic: z.boolean(),
})

export type TagFormValues = z.infer<typeof tagFormSchema>
