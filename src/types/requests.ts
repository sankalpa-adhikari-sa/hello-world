import { z } from 'zod'
import { REQUEST_TYPE } from '@/constants/enums'

export type RequestTypeValue = (typeof REQUEST_TYPE)[number]['value']

const requestTypeField = z.enum(
  REQUEST_TYPE.map((group) => group.value) as [string, ...Array<string>],
)

const baseRequestSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().nullish(),
  content: z.any().optional().default({}),
  requestType: requestTypeField,
  tagIds: z.array(z.uuid()).max(50).optional(),
})

export const requestInputSchema = baseRequestSchema

export const requestOutputSchema = baseRequestSchema.extend({
  id: z.uuid(),
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
  createdById: z.uuid(),
})

export type RequestInput = z.infer<typeof requestInputSchema>
export type RequestOutput = z.infer<typeof requestOutputSchema>
