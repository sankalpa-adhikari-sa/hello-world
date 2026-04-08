import type { JSONContent } from '@tiptap/core'
import { REQUEST_TYPE } from '@/constants/enums'
import { z } from 'zod'

export type RequestTypeValue = (typeof REQUEST_TYPE)[number]['value']

export interface RequestCardProps {
  id: string
  title: string
  description: string
  requestType: RequestTypeValue
  tags: string[]
  isOpen: boolean
  fulfillLabel?: string
  detailsLabel?: string
  onFulfillClick?: () => void
  onDetailsClick?: () => void
  /** Shown when the viewer is allowed to edit (e.g. request author). */
  onEditClick?: () => void
  editLabel?: string
}

const requestTypeField = z.enum(
  REQUEST_TYPE.map((group) => group.value) as [string, ...Array<string>],
)

/** TipTap JSON document (`type: 'doc'`). */
const requestContentField = z
  .any()
  .refine(
    (v): v is JSONContent =>
      v !== null &&
      typeof v === 'object' &&
      !Array.isArray(v) &&
      (v as JSONContent).type === 'doc',
    { message: 'Add details in the editor (document body is required).' },
  )

/** TanStack Form + server create/update; `content` is TipTap JSON. */
export const requestCreateFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().optional(),
  requestType: requestTypeField,
  content: requestContentField,
  tagIds: z.array(z.string().uuid()),
})

export const requestUpdateFormSchema = requestCreateFormSchema

export type RequestCreateFormValues = z.infer<typeof requestCreateFormSchema>
export type RequestUpdateFormValues = z.infer<typeof requestUpdateFormSchema>

const baseRequestSchema = z.object({
  title: z.string(),
  /** @deprecated typo — prefer `subtitle` */
  subititle: z.string().nullish(),
  subtitle: z.string().nullish(),
  content: z.any().nullish(),
  requestType: requestTypeField.nullish(),
})

export const requestInputSchema = baseRequestSchema

export const requestOutputSchema = baseRequestSchema.extend({
  id: z.uuid(),
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
  createdById: z.uuid(),
})

export const requestFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subititle: z.string().nullish(),
  subtitle: z.string().nullish(),
  content: z.any().nullish(),
  requestType: requestTypeField.nullish(),
})

export type RequestInput = z.infer<typeof requestInputSchema>
export type RequestOutput = z.infer<typeof requestOutputSchema>
export type RequestFormValues = z.infer<typeof requestFormSchema>
