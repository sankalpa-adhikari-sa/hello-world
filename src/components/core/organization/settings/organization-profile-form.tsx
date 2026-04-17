'use client'

import { useForm } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  COMPANY_SIZE,
  INDUSTRY_TYPE,
  ORGANIZATION_TYPE,
} from '@/constants/enums'
import type { GetOrganizationProfileResult } from '@/sfn/organization/profile'
import { updateOrganizationProfile } from '@/sfn/organization/profile'
import { organizationProfileFormSchema } from '@/types/organization-form'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
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
import { Textarea } from '@/components/ui/textarea'

function aboutFromContent(content: unknown): string {
  if (
    content &&
    typeof content === 'object' &&
    !Array.isArray(content) &&
    typeof (content as { about?: unknown }).about === 'string'
  ) {
    return (content as { about: string }).about
  }
  return ''
}

function toFormDefaults(
  data: GetOrganizationProfileResult,
): Record<string, unknown> {
  const p = data.profile
  return {
    subtitle: p.subtitle ?? '',
    about: aboutFromContent(p.content),
    content: {},
    website: p.website ?? '',
    location: p.location ?? '',
    industry: p.industry ?? 'agriculture',
    organizationType: p.organizationType ?? 'ngo_ingo',
    companySize: p.companySize ?? '',
    foundedYear: p.foundedYear ?? '',
    contactEmail: p.contactEmail ?? '',
    linkedinUrl: p.linkedinUrl ?? '',
    twitterUrl: p.twitterUrl ?? '',
  }
}

type OrganizationProfileFormProps = {
  organizationId: string
  initial: GetOrganizationProfileResult
}

export function OrganizationProfileForm({
  organizationId,
  initial,
}: OrganizationProfileFormProps) {
  const queryClient = useQueryClient()
  const canEdit = initial.myRole === 'owner' || initial.myRole === 'admin'

  const mutation = useMutation({
    mutationFn: (value: Record<string, unknown>) =>
      updateOrganizationProfile({
        data: {
          organizationId,
          subtitle: value.subtitle as string | null | undefined,
          about: value.about as string | null | undefined,
          website: value.website as string | null | undefined,
          location: value.location as string | null | undefined,
          industry: value.industry as string,
          organizationType: value.organizationType as string,
          companySize:
            value.companySize === '' || value.companySize == null
              ? undefined
              : (value.companySize as string),
          foundedYear:
            value.foundedYear === '' || value.foundedYear == null
              ? undefined
              : Number(value.foundedYear),
          contactEmail: value.contactEmail as string | null | undefined,
          linkedinUrl: value.linkedinUrl as string | null | undefined,
          twitterUrl: value.twitterUrl as string | null | undefined,
        },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['organizationProfile', organizationId],
      })
      toast.success('Organization profile saved')
    },
    onError: (error) => {
      toast.error('Could not save profile', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    },
  })

  const form = useForm({
    defaultValues: toFormDefaults(initial),
    validators: {
      onSubmit: organizationProfileFormSchema,
    },
    onSubmit: async ({ value }) => {
      if (!canEdit) return
      await mutation.mutateAsync(value as Record<string, unknown>)
    },
  })

  return (
    <form
      className="max-w-2xl space-y-6"
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
    >
      {!canEdit && (
        <p className="text-muted-foreground text-xs">
          You can view this profile. Only owners and admins can edit it.
        </p>
      )}

      <FieldGroup className="gap-4">
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
                  value={String(field.state.value ?? '')}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  disabled={!canEdit}
                  placeholder="Short tagline"
                  autoComplete="off"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />

        <form.Field
          name="about"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>About</FieldLabel>
                <Textarea
                  id={field.name}
                  name={field.name}
                  value={String(field.state.value ?? '')}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  disabled={!canEdit}
                  placeholder="Describe your organization"
                  rows={6}
                  className="min-h-24"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />

        <form.Field
          name="website"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Website</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={String(field.state.value ?? '')}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  disabled={!canEdit}
                  placeholder="https://"
                  autoComplete="off"
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
                  value={String(field.state.value ?? '')}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  disabled={!canEdit}
                  placeholder="City, country"
                  autoComplete="off"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />

        <form.Field
          name="industry"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Industry</FieldLabel>
                <Select
                  value={String(field.state.value)}
                  onValueChange={(v) => field.handleChange(v)}
                  disabled={!canEdit}
                >
                  <SelectTrigger
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    aria-invalid={isInvalid}
                  >
                    <SelectValue placeholder="Industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRY_TYPE.map((opt) => (
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
          name="organizationType"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Organization type</FieldLabel>
                <Select
                  value={String(field.state.value)}
                  onValueChange={(v) => field.handleChange(v)}
                  disabled={!canEdit}
                >
                  <SelectTrigger
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    aria-invalid={isInvalid}
                  >
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ORGANIZATION_TYPE.map((opt) => (
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
          name="companySize"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Company size</FieldLabel>
                <Select
                  value={
                    field.state.value ? String(field.state.value) : '__none__'
                  }
                  onValueChange={(v) =>
                    field.handleChange(v === '__none__' ? '' : v)
                  }
                  disabled={!canEdit}
                >
                  <SelectTrigger
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    aria-invalid={isInvalid}
                  >
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Not specified</SelectItem>
                    {COMPANY_SIZE.map((opt) => (
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
          name="foundedYear"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Founded year</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="number"
                  value={
                    field.state.value === '' || field.state.value == null
                      ? ''
                      : String(field.state.value)
                  }
                  onBlur={field.handleBlur}
                  onChange={(e) => {
                    const raw = e.target.value
                    field.handleChange(raw === '' ? '' : Number(raw))
                  }}
                  aria-invalid={isInvalid}
                  disabled={!canEdit}
                  placeholder="e.g. 2010"
                  autoComplete="off"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />

        <form.Field
          name="contactEmail"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Contact email</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="email"
                  value={String(field.state.value ?? '')}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  disabled={!canEdit}
                  placeholder="contact@org.org"
                  autoComplete="off"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />

        <form.Field
          name="linkedinUrl"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>LinkedIn URL</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={String(field.state.value ?? '')}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  disabled={!canEdit}
                  placeholder="https://linkedin.com/company/…"
                  autoComplete="off"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />

        <form.Field
          name="twitterUrl"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>X / Twitter URL</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={String(field.state.value ?? '')}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  disabled={!canEdit}
                  placeholder="https://x.com/…"
                  autoComplete="off"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        />
      </FieldGroup>

      {canEdit && (
        <Button
          type="submit"
          disabled={form.state.isSubmitting || mutation.isPending}
        >
          {form.state.isSubmitting || mutation.isPending ? (
            <>
              <Spinner /> Saving
            </>
          ) : (
            'Save profile'
          )}
        </Button>
      )}
    </form>
  )
}
