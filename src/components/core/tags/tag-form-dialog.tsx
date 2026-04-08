'use client'

import { useForm } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { toast } from 'sonner'

import type { TagFormValues } from '@/types/tags'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import { createTag, updateTag } from '@/sfn/tags'
import { tagFormSchema } from '@/types/tags'

const defaultValues: TagFormValues = {
  name: '',
  isPublic: false,
}

export interface TagFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  tag?: { id: string; name: string; isPublic: boolean }
}

export function TagFormDialog({
  open,
  onOpenChange,
  mode,
  tag,
}: TagFormDialogProps) {
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: (value: TagFormValues) =>
      createTag({
        data: { name: value.name, isPublic: value.isPublic },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['tags'] })
      toast.success('Tag created')
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error('Could not create tag', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: (value: TagFormValues & { id: string }) =>
      updateTag({
        data: {
          id: value.id,
          name: value.name,
          isPublic: value.isPublic,
        },
      }),
    onSuccess: async (row) => {
      await queryClient.invalidateQueries({ queryKey: ['tags'] })
      if (row) {
        toast.success('Tag updated')
        onOpenChange(false)
      } else {
        toast.error('Update failed', {
          description: 'Tag not found or you do not have access.',
        })
      }
    },
    onError: (error) => {
      toast.error('Could not update tag', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    },
  })

  const form = useForm({
    defaultValues,
    validators: {
      onSubmit: tagFormSchema,
    },
    onSubmit: async ({ value }) => {
      if (mode === 'create') {
        await createMutation.mutateAsync(value)
      } else if (tag) {
        await updateMutation.mutateAsync({ ...value, id: tag.id })
      }
    },
  })

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && tag) {
      form.reset({
        name: tag.name,
        isPublic: tag.isPublic,
      })
    } else if (mode === 'create') {
      form.reset(defaultValues)
    }
  }, [open, mode, tag, form])

  const submitting = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'New tag' : 'Edit tag'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Create a label you can attach to requests. Public tags are visible to everyone.'
              : 'Update the tag name or visibility.'}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            void form.handleSubmit()
          }}
        >
          <FieldGroup className="gap-4 py-2">
            <form.Field
              name="name"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Name</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      autoComplete="off"
                      placeholder="e.g. Open data"
                    />
                    {isInvalid ? (
                      <FieldError errors={field.state.meta.errors} />
                    ) : null}
                  </Field>
                )
              }}
            />
            <form.Field
              name="isPublic"
              children={(field) => (
                <Field>
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <FieldLabel className="text-sm">Public tag</FieldLabel>
                      <p className="text-muted-foreground text-xs">
                        When public, others can see and use this tag on their
                        requests.
                      </p>
                    </div>
                    <Switch
                      checked={field.state.value}
                      onCheckedChange={(checked) =>
                        field.handleChange(Boolean(checked))
                      }
                    />
                  </div>
                </Field>
              )}
            />
          </FieldGroup>
          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={submitting}
              className="cursor-pointer"
            >
              {submitting ? (
                <>
                  <Spinner />
                  {mode === 'create' ? 'Creating…' : 'Saving…'}
                </>
              ) : mode === 'create' ? (
                'Create'
              ) : (
                'Save'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
