'use client'

import { useForm } from '@tanstack/react-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { toast } from 'sonner'

import { RichTextEditor } from '@/components/core/tiptap/rich-text-editor'
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
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import {
  createFundAProject,
  getFundAProjectById,
  updateFundAProject,
} from '@/sfn/fund-a-project'
import { listTagsForRequestsFormQO } from '@/sfn/requests'
import type {
  FundAProjectCreateFormValues,
  FundProjectLevel,
} from '@/types/fund-a-project'
import {
  FUND_PROJECT_LEVEL_KEYS,
  FUND_PROJECT_LEVEL_LABEL,
  buildFundAProjectPayloadContent,
  defaultFundAProjectCreateFormValues,
  extractFundAProjectStory,
  extractLegacyFundAProjectCoverImageUrl,
  fundAProjectCreateFormSchema,
} from '@/types/fund-a-project'

const authenticatedRouteApi = getRouteApi('/_authenticated')

export interface FundAProjectFormProps {
  mode: 'create' | 'edit'
  /** Required when `mode` is `edit` */
  fundAProjectId?: string
}

export function FundAProjectForm({
  mode,
  fundAProjectId,
}: FundAProjectFormProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { currentUser: authBundle } = authenticatedRouteApi.useLoaderData()
  const sessionUserId = authBundle.currentUser.id

  const tagsQuery = useQuery(listTagsForRequestsFormQO())

  const projectQuery = useQuery({
    queryKey: ['fund-a-project', fundAProjectId],
    queryFn: () =>
      getFundAProjectById({ data: { id: fundAProjectId! } }),
    enabled: mode === 'edit' && Boolean(fundAProjectId),
  })

  const project = projectQuery.data ?? undefined
  const isOwner = project && sessionUserId === project.createdById

  const createMutation = useMutation({
    mutationFn: async (value: FundAProjectCreateFormValues) => {
      return createFundAProject({
        data: {
          title: value.title,
          subtitle: value.subtitle || undefined,
          targetAmount: value.targetAmount,
          fundedAmount: value.fundedAmount,
          projectLevel: value.projectLevel,
          coverImageUrl: value.coverImageUrl?.trim() || undefined,
          coverImageAlt: value.coverImageAlt?.trim() || undefined,
          content: buildFundAProjectPayloadContent(value),
          tagIds: value.tagIds.length ? value.tagIds : undefined,
        },
      })
    },
    onSuccess: async (row) => {
      await queryClient.invalidateQueries({ queryKey: ['fund-a-projects'] })
      toast.success('Campaign created')
      if (row?.id) {
        navigate({ to: '/fund-a-project/$id', params: { id: row.id } })
      }
    },
    onError: (error) => {
      toast.error('Could not create campaign', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (value: FundAProjectCreateFormValues) => {
      if (!fundAProjectId) throw new Error('Missing campaign id')
      return updateFundAProject({
        data: {
          id: fundAProjectId,
          title: value.title,
          subtitle: value.subtitle || undefined,
          targetAmount: value.targetAmount,
          fundedAmount: value.fundedAmount,
          projectLevel: value.projectLevel,
          coverImageUrl: value.coverImageUrl?.trim() || undefined,
          coverImageAlt: value.coverImageAlt?.trim() || undefined,
          content: buildFundAProjectPayloadContent(value),
          tagIds: value.tagIds,
        },
      })
    },
    onSuccess: async (row) => {
      await queryClient.invalidateQueries({ queryKey: ['fund-a-projects'] })
      if (fundAProjectId) {
        await queryClient.invalidateQueries({
          queryKey: ['fund-a-project', fundAProjectId],
        })
      }
      if (row) {
        toast.success('Campaign updated')
      } else {
        toast.error('Update failed', {
          description: 'Campaign not found or you do not have access.',
        })
      }
    },
    onError: (error) => {
      toast.error('Could not update campaign', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    },
  })

  const form = useForm({
    defaultValues: defaultFundAProjectCreateFormValues(),
    validators: {
      onSubmit: fundAProjectCreateFormSchema,
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
    if (mode !== 'edit' || !project) return
    form.reset({
      title: project.title,
      subtitle: project.subtitle ?? '',
      targetAmount: project.targetAmount,
      fundedAmount: project.fundedAmount,
      projectLevel: project.projectLevel,
      coverImageUrl:
        project.coverImageUrl?.trim() ||
        extractLegacyFundAProjectCoverImageUrl(project.content) ||
        '',
      coverImageAlt: project.coverImageAlt ?? '',
      story: extractFundAProjectStory(project.content),
      tagIds: project.tags.map((t) => t.id),
    })
  }, [mode, project?.id, project?.updatedAt, form])

  if (mode === 'edit') {
    if (!fundAProjectId) {
      return (
        <p className="text-muted-foreground p-6 text-sm">Missing campaign id.</p>
      )
    }
    if (projectQuery.isLoading) {
      return (
        <div className="text-muted-foreground flex items-center gap-2 p-6 text-sm">
          <Spinner />
          Loading campaign…
        </div>
      )
    }
    if (!project) {
      return (
        <p className="text-muted-foreground p-6 text-sm">Campaign not found.</p>
      )
    }
    if (!isOwner) {
      return (
        <p className="text-muted-foreground p-6 text-sm">
          You can only edit campaigns you created.
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
                {isInvalid && (
                  <FieldError errors={field.state.meta.errors} />
                )}
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
                {isInvalid && (
                  <FieldError errors={field.state.meta.errors} />
                )}
              </Field>
            )
          }}
        />

        <div className="grid gap-6 sm:grid-cols-2">
          <form.Field
            name="targetAmount"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Target (USD)</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="number"
                    min={1}
                    step={1}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) =>
                      field.handleChange(Number(e.target.value))
                    }
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && (
                    <FieldError errors={field.state.meta.errors} />
                  )}
                </Field>
              )
            }}
          />

          <form.Field
            name="fundedAmount"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Raised so far (USD)</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="number"
                    min={0}
                    step={1}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) =>
                      field.handleChange(Number(e.target.value))
                    }
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && (
                    <FieldError errors={field.state.meta.errors} />
                  )}
                </Field>
              )
            }}
          />
        </div>

        <FieldSet>
          <FieldLegend className="text-sm font-medium">
            Listing card
          </FieldLegend>
          <p className="text-muted-foreground mb-4 text-xs">
            The grid badge uses the project level below. Your display name and
            school line come from your profile (display name and student fields
            when you are marked as a student).
          </p>
          <div className="space-y-4">
            <form.Field
              name="projectLevel"
              children={(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Project level</FieldLabel>
                  <select
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) =>
                      field.handleChange(e.target.value as FundProjectLevel)
                    }
                    className={cn(
                      'bg-input/20 dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/30 h-7 rounded-md border px-2 py-0.5 text-sm transition-colors focus-visible:ring-2 md:text-xs/relaxed w-full min-w-0 outline-none',
                    )}
                  >
                    {FUND_PROJECT_LEVEL_KEYS.map((key) => (
                      <option key={key} value={key}>
                        {FUND_PROJECT_LEVEL_LABEL[key]}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
            />
            <form.Field
              name="coverImageUrl"
              children={(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Cover image URL</FieldLabel>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="https://…"
                    autoComplete="off"
                  />
                </Field>
              )}
            />
            <form.Field
              name="coverImageAlt"
              children={(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Cover image alt text</FieldLabel>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Short description for screen readers"
                    autoComplete="off"
                  />
                </Field>
              )}
            />
          </div>
        </FieldSet>

        <form.Field
          name="story"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Story</FieldLabel>
                <div id={field.name} className="mt-1">
                  <RichTextEditor
                    content={field.state.value}
                    onChange={(json) => {
                      field.handleChange(json)
                    }}
                    placeholder="Describe your project, timeline, and how funds will be used…"
                    className="w-full"
                  />
                </div>
                {isInvalid && (
                  <FieldError errors={field.state.meta.errors} />
                )}
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
            'Create campaign'
          ) : (
            'Save changes'
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="cursor-pointer"
          onClick={() => navigate({ to: '/fund-a-project' })}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
