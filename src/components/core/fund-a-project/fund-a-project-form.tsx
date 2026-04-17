'use client'

import { useForm } from '@tanstack/react-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'

import type {
  FundAProjectInput,
  FundAProjectOutput,
  FundProjectLevel,
  UpdateFundAProjectInput,
} from '@/types/fund-a-project'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import {
  getRichTextEditorContent,
  setRichTextEditorContent,
} from '@/lib/rich-text-content'
import { createFundAProject, updateFundAProject } from '@/sfn/fund-a-project'
import { listTagsForRequestsFormQO } from '@/sfn/requests'
import {
  FUND_PROJECT_LEVEL_KEYS,
  FUND_PROJECT_LEVEL_LABEL,
  fundAPublicListDefaultSearch,
  fundAProjectInputSchema,
  updateFundAProjectInputSchema,
} from '@/types/fund-a-project'

const authenticatedRouteApi = getRouteApi('/_authenticated')

export interface FundAProjectFormProps {
  mode: 'create' | 'edit'
  fundAProjectId?: string
  initialProject?: FundAProjectOutput | null
}

function toFundAProjectFormValues(
  project: FundAProjectOutput,
): FundAProjectInput {
  return {
    title: project.title,
    subtitle: project.subtitle ?? undefined,
    targetAmount: project.targetAmount,
    fundedAmount: project.fundedAmount,
    projectLevel: project.projectLevel,
    coverImageUrl: project.coverImageUrl?.trim() || undefined,
    coverImageAlt: project.coverImageAlt ?? undefined,
    content: project.content ?? {},
    tagIds: project.tags.map((t) => t.id),
  }
}

type FundAProjectFormInnerProps = {
  mode: 'create' | 'edit'
  fundAProjectId?: string
  initialValues: FundAProjectInput
}

function toTextInputValue(value: string | null | undefined): string {
  return value ?? ''
}

function toOptionalString(
  value: string | null | undefined,
): string | undefined {
  if (!value) return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

function normalizePayload(values: FundAProjectInput): FundAProjectInput {
  return fundAProjectInputSchema.parse({
    ...values,
    subtitle: toOptionalString(values.subtitle),
    coverImageUrl: toOptionalString(values.coverImageUrl),
    coverImageAlt: toOptionalString(values.coverImageAlt),
    tagIds: values.tagIds ?? [],
    content:
      values.content &&
      typeof values.content === 'object' &&
      !Array.isArray(values.content)
        ? values.content
        : {},
  })
}

function FundAProjectFormInner({
  mode,
  fundAProjectId,
  initialValues,
}: FundAProjectFormInnerProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const tagsQuery = useQuery(listTagsForRequestsFormQO())
  const isAddMode = mode === 'create'

  const createMutation = useMutation({
    mutationFn: async (value: FundAProjectInput) => {
      return createFundAProject({
        data: value,
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
    mutationFn: async (value: FundAProjectInput) => {
      if (!fundAProjectId) throw new Error('Missing campaign id')
      const data: UpdateFundAProjectInput = updateFundAProjectInputSchema.parse(
        { id: fundAProjectId, ...value },
      )
      return updateFundAProject({ data })
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
    defaultValues: initialValues,
    onSubmit: async ({ value }) => {
      try {
        const parsedPayload = normalizePayload(value)
        if (isAddMode) {
          await createMutation.mutateAsync(parsedPayload)
        } else {
          await updateMutation.mutateAsync(parsedPayload)
        }
      } catch (error) {
        console.error(error)
        toast.error(
          isAddMode ? 'Could not create campaign' : 'Could not update campaign',
          {
            description:
              error instanceof Error ? error.message : 'Unknown error',
          },
        )
      }
    },
  })

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
                  value={toTextInputValue(field.state.value)}
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
                  value={toTextInputValue(field.state.value)}
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
                    onChange={(e) => field.handleChange(Number(e.target.value))}
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
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
                  <FieldLabel htmlFor={field.name}>
                    Raised so far (USD)
                  </FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="number"
                    min={0}
                    step={1}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(Number(e.target.value))}
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
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
                  <Select
                    value={field.state.value}
                    onValueChange={(value) =>
                      field.handleChange(value as FundProjectLevel)
                    }
                  >
                    <SelectTrigger
                      id={field.name}
                      name={field.name}
                      onBlur={field.handleBlur}
                      className={cn('w-full')}
                    >
                      <SelectValue placeholder="Select project level" />
                    </SelectTrigger>
                    <SelectContent>
                      {FUND_PROJECT_LEVEL_KEYS.map((key) => (
                        <SelectItem key={key} value={key}>
                          {FUND_PROJECT_LEVEL_LABEL[key]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    value={toTextInputValue(field.state.value)}
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
                  <FieldLabel htmlFor={field.name}>
                    Cover image alt text
                  </FieldLabel>
                  <Input
                    id={field.name}
                    value={toTextInputValue(field.state.value)}
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
          name="content"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Story</FieldLabel>
                <div id={field.name} className="mt-1">
                  <RichTextEditor
                    content={getRichTextEditorContent(
                      field.state.value,
                      'story',
                    )}
                    onChange={(json) => {
                      field.handleChange(
                        setRichTextEditorContent(
                          field.state.value,
                          json as unknown as Record<string, unknown>,
                          'story',
                        ),
                      )
                    }}
                    placeholder="Describe your project, timeline, and how funds will be used…"
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

      <form.Subscribe
        selector={(state) => ({
          isSubmitting: state.isSubmitting,
          isDirty: state.isDirty,
        })}
        children={({ isSubmitting, isDirty }) => (
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              disabled={isSubmitting || !isDirty}
              onClick={() => form.reset()}
            >
              Reset
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !isDirty}
              className="cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Spinner />
                  {isAddMode ? 'Creating…' : 'Saving…'}
                </>
              ) : isAddMode ? (
                'Create campaign'
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
                  to: '/fund-a-project',
                  search: fundAPublicListDefaultSearch,
                })
              }
            >
              Cancel
            </Button>
          </div>
        )}
      />
    </form>
  )
}

export function FundAProjectForm({
  mode,
  fundAProjectId,
  initialProject,
}: FundAProjectFormProps) {
  const { currentUser: authBundle } = authenticatedRouteApi.useLoaderData()
  const sessionUserId = authBundle.currentUser.id
  const isAddMode = mode === 'create'
  const defaultValues: FundAProjectInput = {
    title: '',
    subtitle: undefined,
    content: {},
    targetAmount: 1000,
    fundedAmount: 0,
    projectLevel: 'undergrad',
    coverImageUrl: undefined,
    coverImageAlt: undefined,
    tagIds: [],
  }

  if (!isAddMode) {
    if (!fundAProjectId) {
      return (
        <p className="text-muted-foreground p-6 text-sm">
          Missing campaign id.
        </p>
      )
    }
    const project = initialProject ?? undefined
    if (!project) {
      return (
        <p className="text-muted-foreground p-6 text-sm">Campaign not found.</p>
      )
    }
    const isOwner = sessionUserId === project.createdById
    if (!isOwner) {
      return (
        <p className="text-muted-foreground p-6 text-sm">
          You can only edit campaigns you created.
        </p>
      )
    }

    return (
      <FundAProjectFormInner
        mode={mode}
        fundAProjectId={fundAProjectId}
        initialValues={toFundAProjectFormValues(project)}
      />
    )
  }

  return <FundAProjectFormInner mode={mode} initialValues={defaultValues} />
}
