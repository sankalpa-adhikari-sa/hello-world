'use client'

import { useForm } from '@tanstack/react-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'

import type { RequestInput } from '@/types/requests'
import { REQUEST_TYPE } from '@/constants/enums'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field'
import { RichTextEditor } from '@/components/core/tiptap/rich-text-editor'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import {
  createRequest,
  listTagsForRequestsFormQO,
  updateRequest,
} from '@/sfn/requests'
import { requestInputSchema } from '@/types/requests'
import {
  asRichTextContent,
  emptyRichTextDocument,
} from '@/lib/tiptap-empty-doc'

const authenticatedRouteApi = getRouteApi('/_authenticated')

const defaultCreateValues: RequestInput = {
  title: '',
  subtitle: undefined,
  requestType: REQUEST_TYPE[0].value,
  content: emptyRichTextDocument,
  tagIds: [],
}

export interface RequestFormProps {
  mode: 'create' | 'edit'
  /** Required when `mode` is `edit` */
  requestId?: string
  initialRequest?: Awaited<ReturnType<typeof createRequest>> | null
}

function toRequestFormValues(
  request: NonNullable<RequestFormProps['initialRequest']>,
): RequestInput {
  return {
    title: request.title,
    subtitle: request.subtitle ?? undefined,
    requestType: request.requestType ?? REQUEST_TYPE[0].value,
    content: asRichTextContent(request.content),
    tagIds: request.tags.map((t) => t.id),
  }
}

type RequestFormInnerProps = {
  mode: 'create' | 'edit'
  requestId?: string
  initialValues: RequestInput
}

function RequestFormInner({
  mode,
  requestId,
  initialValues,
}: RequestFormInnerProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const tagsQuery = useQuery(listTagsForRequestsFormQO())

  const toTextValue = (value: string | null | undefined): string => value ?? ''
  const toOptionalString = (
    value: string | null | undefined,
  ): string | undefined => {
    if (!value) return undefined
    const trimmed = value.trim()
    return trimmed ? trimmed : undefined
  }
  const normalizePayload = (value: RequestInput): RequestInput =>
    requestInputSchema.parse({
      ...value,
      subtitle: toOptionalString(value.subtitle),
      requestType: value.requestType ?? REQUEST_TYPE[0].value,
      content:
        value.content &&
        typeof value.content === 'object' &&
        !Array.isArray(value.content)
          ? value.content
          : emptyRichTextDocument,
      tagIds: value.tagIds ?? [],
    })

  const createMutation = useMutation({
    mutationFn: async (value: RequestInput) => {
      return createRequest({
        data: {
          title: value.title,
          subtitle: value.subtitle || undefined,
          requestType: value.requestType ?? REQUEST_TYPE[0].value,
          content: value.content as Record<string, unknown>,
          tagIds: (value.tagIds ?? []).length ? value.tagIds : undefined,
        },
      })
    },
    onSuccess: async (row) => {
      await queryClient.invalidateQueries({ queryKey: ['requests'] })
      toast.success('Request created')
      if (row?.id) {
        navigate({ to: '/requests/$id', params: { id: row.id } })
      }
    },
    onError: (error) => {
      toast.error('Could not create request', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (value: RequestInput) => {
      if (!requestId) throw new Error('Missing request id')
      return updateRequest({
        data: {
          id: requestId,
          title: value.title,
          subtitle: value.subtitle || undefined,
          requestType: value.requestType ?? REQUEST_TYPE[0].value,
          content: value.content as Record<string, unknown>,
          tagIds: value.tagIds,
        },
      })
    },
    onSuccess: async (row) => {
      await queryClient.invalidateQueries({ queryKey: ['requests'] })
      if (requestId) {
        await queryClient.invalidateQueries({
          queryKey: ['request', requestId],
        })
      }
      if (row) {
        toast.success('Request updated')
      } else {
        toast.error('Update failed', {
          description: 'Request not found or you do not have access.',
        })
      }
    },
    onError: (error) => {
      toast.error('Could not update request', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    },
  })

  const form = useForm({
    defaultValues: initialValues,
    onSubmit: async ({ value }) => {
      try {
        const parsed = normalizePayload(value)
        if (mode === 'create') {
          await createMutation.mutateAsync(parsed)
        } else {
          await updateMutation.mutateAsync(parsed)
        }
      } catch (error) {
        toast.error(
          mode === 'create'
            ? 'Could not create request'
            : 'Could not update request',
          {
            description:
              error instanceof Error ? error.message : 'Unknown error',
          },
        )
      }
    },
  })

  const submitting =
    form.state.isSubmitting ||
    createMutation.isPending ||
    updateMutation.isPending

  return (
    <form
      className="mx-auto max-w-2xl space-y-8 p-6"
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        void form.handleSubmit()
      }}
    >
      <FieldGroup>
        <form.Field
          name="title"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Title</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={toTextValue(field.state.value)}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  autoComplete="off"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />

        <form.Field
          name="subtitle"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Subtitle</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={toTextValue(field.state.value)}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  autoComplete="off"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />

        <form.Field
          name="requestType"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Request type</FieldLabel>
                <Select
                  value={field.state.value}
                  onValueChange={(value) =>
                    field.handleChange(value ?? REQUEST_TYPE[0].value)
                  }
                >
                  <SelectTrigger
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    aria-invalid={isInvalid}
                  >
                    <SelectValue placeholder="Select request type" />
                  </SelectTrigger>
                  <SelectContent>
                    {REQUEST_TYPE.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />

        <form.Field
          name="content"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Content</FieldLabel>
                <div id={field.name} className="mt-1">
                  <RichTextEditor
                    content={field.state.value}
                    onChange={(json) => {
                      field.handleChange(json)
                    }}
                    placeholder="Describe what you need, context, and any constraints…"
                    className="w-full"
                  />
                </div>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />

        <form.Field
          name="tagIds"
          children={(field) => {
            return (
              <FieldSet>
                <FieldLegend className="text-sm font-medium">Tags</FieldLegend>
                {tagsQuery.isLoading ? (
                  <span className="text-muted-foreground flex items-center gap-2 text-xs">
                    <Spinner />
                    Loading tags…
                  </span>
                ) : tagsQuery.data?.length ? (
                  <div className="flex flex-col gap-2 pt-1">
                    {tagsQuery.data.map((t) => (
                      <label
                        key={t.id}
                        className="flex cursor-pointer items-center gap-2 text-sm"
                      >
                        <Checkbox
                          checked={(field.state.value ?? []).includes(t.id)}
                          onCheckedChange={(checked) => {
                            const next = checked
                              ? [...(field.state.value ?? []), t.id]
                              : (field.state.value ?? []).filter(
                                  (id) => id !== t.id,
                                )
                            field.handleChange(next)
                          }}
                        />
                        <span>{t.name}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-xs">
                    No tags available yet.
                  </p>
                )}
              </FieldSet>
            )
          }}
        />
      </FieldGroup>

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting} className="cursor-pointer">
          {submitting ? (
            <>
              <Spinner />
              {mode === 'create' ? 'Creating…' : 'Saving…'}
            </>
          ) : mode === 'create' ? (
            'Create request'
          ) : (
            'Save changes'
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="cursor-pointer"
          onClick={() =>
            navigate({
              to: '/requests',
              search: {
                page: 1,
                pageSize: 12,
                q: undefined,
                sort: 'desc',
                tags: undefined,
                types: undefined,
              },
            })
          }
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}

export function RequestForm({
  mode,
  requestId,
  initialRequest,
}: RequestFormProps) {
  const { currentUser: authBundle } = authenticatedRouteApi.useLoaderData()
  const sessionUserId = authBundle?.currentUser?.id
  const isAddMode = mode === 'create'

  if (!isAddMode) {
    if (!requestId) {
      return (
        <p className="text-muted-foreground text-sm">Missing request id.</p>
      )
    }
    const request = initialRequest ?? undefined
    if (!request) {
      return (
        <p className="text-muted-foreground text-sm p-6">Request not found.</p>
      )
    }
    const isOwner = Boolean(
      sessionUserId && request.createdById === sessionUserId,
    )
    if (!isOwner) {
      return (
        <p className="text-muted-foreground text-sm p-6">
          You can only edit requests you created.
        </p>
      )
    }
    return (
      <RequestFormInner
        mode={mode}
        requestId={requestId}
        initialValues={toRequestFormValues(request)}
      />
    )
  }

  return <RequestFormInner mode={mode} initialValues={defaultCreateValues} />
}
