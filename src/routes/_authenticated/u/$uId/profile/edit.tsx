import { createFileRoute, redirect } from '@tanstack/react-router'
import { UserProfileForm } from '@/components/core/profile/user-profile-form'
import { getCurrentUserProfileQO } from '@/sfn/users'

export const Route = createFileRoute('/_authenticated/u/$uId/profile/edit')({
  loader: async ({ context, params }) => {
    const profile = await context.queryClient.ensureQueryData(
      getCurrentUserProfileQO({ userId: params.uId }),
    )
    if (!profile) {
      throw redirect({ to: '/u/$uId/profile/new', params: { uId: params.uId } })
    }
    return { profile }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { uId } = Route.useParams()
  const { profile } = Route.useLoaderData()
  return (
    <article className="border-border border-b">
      <header className="border-border border-b px-6 py-4">
        <h1 className="text-lg font-bold uppercase tracking-tight">
          Edit profile
        </h1>
        <p className="text-muted-foreground mt-1 text-xs">
          Keep your public profile details up to date.
        </p>
      </header>
      <UserProfileForm mode="edit" userId={uId} initialProfile={profile} />
    </article>
  )
}
