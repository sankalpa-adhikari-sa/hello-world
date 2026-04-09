'use client'

import { useForm } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import type { UserProfileInput, UserProfileOutput } from '@/types/user'
import { userProfileInputSchema } from '@/types/user'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { createUserProfile, updateUserProfile } from '@/sfn/users'

const authenticatedRouteApi = getRouteApi('/_authenticated')

const defaultCreateValues: UserProfileInput = {
  displayName: undefined,
  bio: undefined,
  headline: undefined,
  websiteUrl: undefined,
  location: undefined,
  isStudent: false,
  studentMajor: undefined,
  studentGraduationYear: undefined,
}

type UserProfileFormProps = {
  mode: 'create' | 'edit'
  userId: string
  initialProfile?: UserProfileOutput | null
}

function toOptionalString(
  value: string | null | undefined,
): string | undefined {
  if (!value) return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

function toTextValue(value: string | null | undefined): string {
  return value ?? ''
}

function toFormValues(profile: UserProfileOutput): UserProfileInput {
  return {
    displayName: profile.displayName ?? undefined,
    bio: profile.bio ?? undefined,
    headline: profile.headline ?? undefined,
    websiteUrl: profile.websiteUrl ?? undefined,
    location: profile.location ?? undefined,
    isStudent: profile.isStudent,
    studentMajor: profile.studentMajor ?? undefined,
    studentGraduationYear: profile.studentGraduationYear ?? undefined,
  }
}

function normalizePayload(value: UserProfileInput): UserProfileInput {
  return userProfileInputSchema.parse({
    ...value,
    displayName: toOptionalString(value.displayName),
    bio: toOptionalString(value.bio),
    headline: toOptionalString(value.headline),
    websiteUrl: toOptionalString(value.websiteUrl),
    location: toOptionalString(value.location),
    studentMajor: value.isStudent
      ? toOptionalString(value.studentMajor)
      : undefined,
    studentGraduationYear: value.isStudent
      ? value.studentGraduationYear
      : undefined,
  })
}

export function UserProfileForm({
  mode,
  userId,
  initialProfile,
}: UserProfileFormProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { currentUser: authBundle } = authenticatedRouteApi.useLoaderData()
  const sessionUserId = authBundle.currentUser.id

  const initialValues =
    mode === 'edit' && initialProfile
      ? toFormValues(initialProfile)
      : defaultCreateValues

  const createMutation = useMutation({
    mutationFn: async (value: UserProfileInput) =>
      createUserProfile({ data: value }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['user', userId] })
      toast.success('Profile created')
      navigate({ to: '/u/$uId/profile', params: { uId: userId } })
    },
    onError: (error) => {
      toast.error('Could not create profile', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (value: UserProfileInput) =>
      updateUserProfile({
        data: {
          userId,
          ...value,
        },
      }),
    onSuccess: async (row) => {
      await queryClient.invalidateQueries({ queryKey: ['user', userId] })
      if (!row) {
        toast.error('Profile not found or you do not have access')
        return
      }
      toast.success('Profile updated')
      navigate({ to: '/u/$uId/profile', params: { uId: userId } })
    },
    onError: (error) => {
      toast.error('Could not update profile', {
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
          return
        }
        await updateMutation.mutateAsync(parsed)
      } catch (error) {
        toast.error(
          mode === 'create'
            ? 'Could not create profile'
            : 'Could not update profile',
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

  if (sessionUserId !== userId) {
    return (
      <p className="text-muted-foreground p-6 text-sm">
        You can only {mode} your own profile.
      </p>
    )
  }

  if (mode === 'edit' && !initialProfile) {
    return (
      <p className="text-muted-foreground p-6 text-sm">Profile not found.</p>
    )
  }

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
          name="displayName"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Display name</FieldLabel>
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
          name="headline"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Headline</FieldLabel>
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
          name="bio"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Bio</FieldLabel>
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
          name="websiteUrl"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Website URL</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={toTextValue(field.state.value)}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  autoComplete="off"
                  placeholder="https://example.com"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />

        <form.Field
          name="location"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Location</FieldLabel>
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
          name="isStudent"
          children={(field) => (
            <Field className="flex items-center gap-2">
              <Checkbox
                id={field.name}
                checked={Boolean(field.state.value)}
                onCheckedChange={(checked) =>
                  field.handleChange(Boolean(checked))
                }
              />
              <FieldLabel htmlFor={field.name}>I am a student</FieldLabel>
            </Field>
          )}
        />

        <form.Subscribe
          selector={(state) => state.values.isStudent}
          children={(isStudent) =>
            isStudent ? (
              <>
                <form.Field
                  name="studentMajor"
                  children={(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>
                        Student major
                      </FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={toTextValue(field.state.value)}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        autoComplete="off"
                      />
                    </Field>
                  )}
                />
                <form.Field
                  name="studentGraduationYear"
                  children={(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>
                        Graduation year
                      </FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="number"
                        min={1900}
                        max={3000}
                        value={field.state.value ?? ''}
                        onBlur={field.handleBlur}
                        onChange={(e) =>
                          field.handleChange(
                            e.target.value ? Number(e.target.value) : undefined,
                          )
                        }
                      />
                    </Field>
                  )}
                />
              </>
            ) : null
          }
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
            'Create profile'
          ) : (
            'Save changes'
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="cursor-pointer"
          onClick={() =>
            navigate({ to: '/u/$uId/profile', params: { uId: userId } })
          }
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
