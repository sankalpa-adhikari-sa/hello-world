import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { redirect } from '@tanstack/react-router'
import { queryOptions } from '@tanstack/react-query'
import z from 'zod'
import { db, eq } from '@/db'
import { user, userProfile } from '@/db/schema/auth.schema'
import { auth } from '@/lib/auth/auth'

/**
 * Retrieves the current active session from the better auth.
 *
 * - **Enforces Auth:** Yes. If no session exists, it throws a redirect to `/login`.
 * - **Usage:** Use this when you only need to verify if a user is logged in or need basic session info (userId, expiresAt).
 *
 * @returns The active session object from better auth.
 * @throws {Redirect} Redirects to '/login' if unauthenticated.
 */
export const getSession = createServerFn().handler(async () => {
  const headers = getRequestHeaders()
  const session = await auth.api.getSession({ headers })
  if (!session) {
    throw redirect({ to: '/login' })
  }
  return session
})

/**
 * Retrieves the full user profile from the database based on the active session.
 *
 * - **Enforces Auth:** Yes. Redirects to `/login` if no session exists.
 * - **Database:** Performs a lookup on the `user` table using the session's user ID.
 * - **Data:** Returns both the raw session and the full database user object.
 *
 * @returns An object containing `{ session, currentUser }`.
 * @throws {Redirect} Redirects to '/login' if unauthenticated or user not found in DB.
 */
export const getCurrentUser = createServerFn().handler(async () => {
  const headers = getRequestHeaders()
  const session = await auth.api.getSession({ headers })
  if (!session) {
    throw redirect({ to: '/login' })
  }
  const currentUser = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
  })
  if (!currentUser) {
    throw redirect({ to: '/login' })
  }
  return {
    session: session,
    currentUser: currentUser,
  }
})

/**
 * Same shape as {@link getCurrentUser} when a session exists; returns `null` when
 * unauthenticated (no redirect). Use for public layouts / headers.
 */
export const getOptionalCurrentUser = createServerFn().handler(async () => {
  const headers = getRequestHeaders()
  const session = await auth.api.getSession({ headers })
  if (!session) {
    return null
  }
  const currentUser = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
  })
  if (!currentUser) {
    return null
  }
  return {
    session,
    currentUser,
  }
})

/**
 * React Query options for fetching the current authenticated user.
 *
 * Intended to be used with `useSuspenseQuery(getCurrentUserQO())` to ensure
 * data is loaded before rendering protected routes.
 *
 * - **Key:** `['currentUser']`
 * - **Fn:** `getCurrentUser`
 */
export const getCurrentUserQO = () => {
  return queryOptions({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(),
  })
}

export const getSafeSession = createServerFn().handler(async () => {
  const headers = getRequestHeaders()
  const session = await auth.api.getSession({ headers })
  return session
})
export const GetUserProfileSchema = z.object({
  userId: z.string().optional(),
})
export const getCurrentUserProfile = createServerFn()
  .inputValidator((data: unknown) => GetUserProfileSchema.parse(data))
  .handler(async ({ data }) => {
    const user = await getCurrentUser()
    const userId = data.userId ?? user.currentUser.id
    const profile = await db.query.userProfile.findFirst({
      where: eq(userProfile.userId, userId),
    })
    return profile
  })

/**
 * React Query options for fetching user profile.
 *
 * @param params -
 */
export const getCurrentUserProfileQO = (
  params: z.infer<typeof GetUserProfileSchema> = {},
) => {
  return queryOptions({
    queryKey: ['user', params.userId],
    queryFn: () => getCurrentUserProfile({ data: params }),
  })
}
