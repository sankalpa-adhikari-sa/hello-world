import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { z } from 'zod'

import { RoleEnum } from '@/constants/enums'
import { getCurrentUser } from '@/sfn/users'
import { auth } from '@/lib/auth/auth'

const CreateOrganizationInvitationSchema = z.object({
  email: z.email(),
  role: z.union([RoleEnum, z.array(RoleEnum)]),
  organizationId: z.string(),
  resend: z.boolean().default(true),
})

export const createOrganizationInvitation = createServerFn({
  method: 'POST',
})
  .inputValidator((data: unknown) =>
    CreateOrganizationInvitationSchema.parse(data),
  )
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()
    await getCurrentUser()
    const result = await auth.api.createInvitation({
      body: {
        email: data.email,
        role: data.role,
        organizationId: data.organizationId,
        resend: data.resend,
      },
      headers,
    })

    return result
  })

export const acceptOrganizationInvitation = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) =>
    z
      .object({
        invitationId: z.string(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()

    await getCurrentUser()

    const result = await auth.api.acceptInvitation({
      body: {
        invitationId: data.invitationId,
      },
      headers,
    })

    return result
  })

export const cancelOrganizationInvitation = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) =>
    z
      .object({
        invitationId: z.string(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()

    await getCurrentUser()

    await auth.api.cancelInvitation({
      body: {
        invitationId: data.invitationId,
      },
      headers,
    })
  })

export const rejectOrganizationInvitation = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) =>
    z
      .object({
        invitationId: z.string(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const headers = getRequestHeaders()

    await getCurrentUser()

    await auth.api.rejectInvitation({
      body: {
        invitationId: data.invitationId,
      },
      headers,
    })
  })

export const listOrganizationInvitation = createServerFn({
  method: 'GET',
}).handler(async () => {
  const { currentUser } = await getCurrentUser()

  const data = await auth.api.listUserInvitations({
    query: {
      email: currentUser.email,
    },
  })
  return data
})
