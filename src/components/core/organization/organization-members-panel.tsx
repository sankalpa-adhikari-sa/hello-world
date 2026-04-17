'use client'

import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { z } from 'zod'
import type {
  ListMembersSchema} from '@/sfn/organization/members';
import {
  addOrganizationMemberDirectly,
  leaveOrganization,
} from '@/sfn/organization'
import { OrgRoles } from '@/sfn/organization/org-roles'
import {
  listOrganizationMembersQO,
  removeOrganizationMember,
  updateMemberRole,
} from '@/sfn/organization/members'
import { createOrganizationInvitation } from '@/sfn/organization/invitations'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'

const addMemberSchema = z.object({
  userId: z.uuid('Enter a valid user ID'),
  role: z.enum(OrgRoles),
})

const inviteMemberSchema = z.object({
  email: z.email('Enter a valid email address'),
  role: z.enum(OrgRoles),
})

type MemberRow = {
  id: string
  userId: string
  role: string
  user: {
    id: string
    name: string
    email: string
    image?: string | null
  }
}

function canManageMembers(role: string) {
  return role === 'owner' || role === 'admin'
}

type OrganizationMembersPanelProps = {
  listParams: z.infer<typeof ListMembersSchema>
  currentUserId: string
}

export function OrganizationMembersPanel({
  listParams,
  currentUserId,
}: OrganizationMembersPanelProps) {
  const organizationId = listParams.organizationId
  if (!organizationId) {
    throw new Error('organizationId is required')
  }
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [addOpen, setAddOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [leaveOpen, setLeaveOpen] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<MemberRow | null>(null)

  const { data } = useSuspenseQuery(listOrganizationMembersQO(listParams))

  const members = (data?.members ?? []) as Array<MemberRow>
  const myMembership = members.find((m) => m.userId === currentUserId)
  const myRole = myMembership?.role ?? 'member'
  const manage = canManageMembers(myRole)

  const invalidateMembers = () =>
    queryClient.invalidateQueries({ queryKey: ['organizationMembers'] })

  const addMutation = useMutation({
    mutationFn: (body: z.infer<typeof addMemberSchema>) =>
      addOrganizationMemberDirectly({
        data: {
          userId: body.userId,
          role: body.role,
          organizationId,
        },
      }),
    onSuccess: async () => {
      await invalidateMembers()
      toast.success('Member added')
      setAddOpen(false)
    },
    onError: (error) => {
      toast.error('Could not add member', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    },
  })

  const inviteMutation = useMutation({
    mutationFn: (body: z.infer<typeof inviteMemberSchema>) =>
      createOrganizationInvitation({
        data: {
          email: body.email,
          role: body.role,
          organizationId,
        },
      }),
    onSuccess: async () => {
      toast.success('Invitation sent successfully')
      setInviteOpen(false)
    },
    onError: (error) => {
      toast.error('Could not send invitation', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    },
  })

  const removeMutation = useMutation({
    mutationFn: (memberIdOrEmail: string) =>
      removeOrganizationMember({
        data: { memberIdOrEmail, organizationId },
      }),
    onSuccess: async () => {
      await invalidateMembers()
      toast.success('Member removed')
      setRemoveTarget(null)
    },
    onError: (error) => {
      toast.error('Could not remove member', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    },
  })

  const roleMutation = useMutation({
    mutationFn: (input: {
      memberId: string
      role: (typeof OrgRoles)[number]
    }) =>
      updateMemberRole({
        data: {
          memberId: input.memberId,
          role: input.role,
          organizationId,
        },
      }),
    onSuccess: async () => {
      await invalidateMembers()
      toast.success('Role updated')
    },
    onError: (error) => {
      toast.error('Could not update role', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    },
  })

  const leaveMutation = useMutation({
    mutationFn: () => leaveOrganization({ data: { organizationId } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['userOrganizations'] })
      toast.success('You left the organization')
      setLeaveOpen(false)
      await navigate({ to: '/' })
    },
    onError: (error) => {
      toast.error('Could not leave organization', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    },
  })

  const addForm = useForm({
    defaultValues: {
      userId: '',
      role: 'member' as (typeof OrgRoles)[number],
    },
    validators: {
      onSubmit: addMemberSchema,
    },
    onSubmit: async ({ value }) => {
      await addMutation.mutateAsync(value)
    },
  })

  const inviteForm = useForm({
    defaultValues: {
      email: '',
      role: 'member' as (typeof OrgRoles)[number],
    },
    validators: {
      onSubmit: inviteMemberSchema,
    },
    onSubmit: async ({ value }) => {
      await inviteMutation.mutateAsync(value)
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-xs">
          {data?.total ?? members.length} member
          {(data?.total ?? members.length) === 1 ? '' : 's'}
        </p>
        <div className="flex flex-wrap gap-2">
          {manage && (
            <>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setAddOpen(true)}
              >
                Add member
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => setInviteOpen(true)}
              >
                Invite member
              </Button>
            </>
          )}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setLeaveOpen(true)}
          >
            Leave organization
          </Button>
        </div>
      </div>

      <div className="ring-foreground/10 divide-y overflow-hidden rounded-lg text-xs ring-1">
        {members.map((m) => {
          const isSelf = m.userId === currentUserId
          const canEditRole = manage && !isSelf && !roleMutation.isPending
          const canRemoveOther = manage && !isSelf

          return (
            <div
              key={m.id}
              className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="truncate font-medium">{m.user.name}</div>
                <div className="text-muted-foreground truncate">
                  {m.user.email}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {canEditRole ? (
                  <Select
                    value={m.role}
                    onValueChange={(role) =>
                      roleMutation.mutate({
                        memberId: m.id,
                        role: role as (typeof OrgRoles)[number],
                      })
                    }
                  >
                    <SelectTrigger size="sm" className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OrgRoles.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="text-muted-foreground bg-muted/60 rounded-md px-2 py-1 capitalize">
                    {m.role}
                  </span>
                )}
                {canRemoveOther && (
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => setRemoveTarget(m)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <Dialog
        open={addOpen}
        onOpenChange={(newValue: boolean) => {
          console.log(
            'Add dialog onOpenChange called with:',
            newValue,
            'current state:',
            addOpen,
          )
          setAddOpen(newValue)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add member</DialogTitle>
            <DialogDescription>
              Enter the user&apos;s ID (UUID from the database). They must
              already have an account.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              addForm.handleSubmit()
            }}
          >
            <FieldGroup className="gap-4">
              <addForm.Field
                name="userId"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>User ID</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                        autoComplete="off"
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  )
                }}
              />
              <addForm.Field
                name="role"
                children={(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Role</FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={(v) =>
                        field.handleChange(v as (typeof OrgRoles)[number])
                      }
                    >
                      <SelectTrigger id={field.name} name={field.name}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OrgRoles.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />
            </FieldGroup>
            <DialogFooter className="mt-4">
              <DialogClose>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={addForm.state.isSubmitting || addMutation.isPending}
              >
                {addForm.state.isSubmitting || addMutation.isPending ? (
                  <>
                    <Spinner /> Adding
                  </>
                ) : (
                  'Add'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite member</DialogTitle>
            <DialogDescription>
              Send an invitation to join this organization via email. The
              recipient will receive an email with a link to accept the
              invitation.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              inviteForm.handleSubmit()
            }}
          >
            <FieldGroup className="gap-4">
              <inviteForm.Field
                name="email"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="email"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        placeholder="user@example.com"
                        autoComplete="email"
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  )
                }}
              />
              <inviteForm.Field
                name="role"
                children={(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Role</FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={(v) =>
                        field.handleChange(v as (typeof OrgRoles)[number])
                      }
                    >
                      <SelectTrigger id={field.name} name={field.name}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OrgRoles.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />
            </FieldGroup>
            <DialogFooter className="mt-4">
              <DialogClose>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={
                  inviteForm.state.isSubmitting || inviteMutation.isPending
                }
              >
                {inviteForm.state.isSubmitting || inviteMutation.isPending ? (
                  <>
                    <Spinner /> Sending
                  </>
                ) : (
                  'Send invitation'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave this organization?</AlertDialogTitle>
            <AlertDialogDescription>
              You will lose access to this organization until you are invited
              again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => leaveMutation.mutate()}
              disabled={leaveMutation.isPending}
            >
              {leaveMutation.isPending ? <Spinner /> : 'Leave'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!removeTarget}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove member?</AlertDialogTitle>
            <AlertDialogDescription>
              {removeTarget
                ? `Remove ${removeTarget.user.name} (${removeTarget.user.email}) from this organization?`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (removeTarget) {
                  removeMutation.mutate(removeTarget.id)
                }
              }}
              disabled={removeMutation.isPending}
            >
              {removeMutation.isPending ? <Spinner /> : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
