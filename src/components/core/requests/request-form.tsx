'use client'

import { useForm } from '@tanstack/react-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { toast } from 'sonner'

import type { RequestCreateFormValues } from '@/types/requests'
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
import { Spinner } from '@/components/ui/spinner'
import {
  createRequest,
  getRequestById,
  listTagsForRequestsFormQO,
  updateRequest,
} from '@/sfn/requests'
import { requestCreateFormSchema } from '@/types/requests'
import {
  asRichTextContent,
  emptyRichTextDocument,
} from '@/lib/tiptap-empty-doc'

const authenticatedRouteApi = getRouteApi('/_authenticated')

const defaultCreateValues: RequestCreateFormValues = {
  title: '',
  subtitle: '',
  requestType: REQUEST_TYPE[0].value,
  content: emptyRichTextDocument,
  tagIds: [],
}

export interface RequestFormProps {
  mode: 'create' | 'edit'
  /** Required when `mode` is `edit` */
  requestId?: string
}

export function RequestForm({ mode, requestId }: RequestFormProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { currentUser: authBundle } = authenticatedRouteApi.useLoaderData()
  const sessionUserId = authBundle?.currentUser?.id

  const tagsQuery = useQuery(listTagsForRequestsFormQO())

  const requestQuery = useQuery({
    queryKey: ['request', requestId],
    queryFn: () => getRequestById({ data: { id: requestId! } }),
    enabled: mode === 'edit' && Boolean(requestId),
  })

  const request = requestQuery.data ?? undefined
  const isOwner = request && sessionUserId === request.createdById

  const createMutation = useMutation({
    mutationFn: async (value: RequestCreateFormValues) => {
      return createRequest({
        data: {
          title: value.title,
          subtitle: value.subtitle || undefined,
          requestType: value.requestType,
          content: value.content as Record<string, unknown>,
          tagIds: value.tagIds.length ? value.tagIds : undefined,
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
    mutationFn: async (value: RequestCreateFormValues) => {
      if (!requestId) throw new Error('Missing request id')
      return updateRequest({
        data: {
          id: requestId,
          title: value.title,
          subtitle: value.subtitle || undefined,
          requestType: value.requestType,
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
    defaultValues: defaultCreateValues,
    validators: {
      onSubmit: requestCreateFormSchema,
    },
    onSubmit: async ({ value }) => {
      if (mode === 'create') {
        await createMutation.mutateAsync(value)
      } else {
        await updateMutation.mutateAsync(value)
      }
    },
  })

  useEffect(() => {
    if (mode !== 'edit' || !request) return
    form.reset({
      title: request.title,
      subtitle: request.subtitle ?? '',
      requestType: request.requestType ?? REQUEST_TYPE[0].value,
      content: asRichTextContent(request.content),
      tagIds: request.tags.map((t) => t.id),
    })
  }, [mode, request?.id, request?.updatedAt, form])

  if (mode === 'edit') {
    if (!requestId) {
      return (
        <p className="text-muted-foreground text-sm">Missing request id.</p>
      )
    }
    if (requestQuery.isLoading) {
      return (
        <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
          <Spinner />
          Loading request…
        </div>
      )
    }
    if (!request) {
      return (
        <p className="text-muted-foreground text-sm p-6">Request not found.</p>
      )
    }
    if (!isOwner) {
      return (
        <p className="text-muted-foreground text-sm p-6">
          You can only edit requests you created.
        </p>
      )
    }
  }

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
                  value={field.state.value}
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
                  value={field.state.value}
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
                <select
                  id={field.name}
                  name={field.name}
                  className="border-input bg-input/20 dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/30 h-9 w-full rounded-md border px-2 py-1 text-sm outline-none focus-visible:ring-2"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                >
                  {REQUEST_TYPE.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
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
                          checked={field.state.value.includes(t.id)}
                          onCheckedChange={(checked) => {
                            const next = checked
                              ? [...field.state.value, t.id]
                              : field.state.value.filter((id) => id !== t.id)
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
          onClick={() => navigate({ to: '/requests' })}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
