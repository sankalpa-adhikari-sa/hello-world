import { createFileRoute, redirect } from '@tanstack/react-router'
import { UserProfileForm } from '@/components/core/profile/user-profile-form'
import { getCurrentUserProfileQO } from '@/sfn/users'

export const Route = createFileRoute('/_authenticated/u/$uId/profile/new')({
  loader: async ({ context, params }) => {
    const profile = await context.queryClient.ensureQueryData(
      getCurrentUserProfileQO({ userId: params.uId }),
    )
    if (profile) {
      throw redirect({
        to: '/u/$uId/profile/edit',
        params: { uId: params.uId },
      })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { uId } = Route.useParams()
  return (
    <article className="border-border border-b">
      <header className="border-border border-b px-6 py-4">
        <h1 className="text-lg font-bold uppercase tracking-tight">
          Create profile
        </h1>
        <p className="text-muted-foreground mt-1 text-xs">
          Add your public details for people browsing your profile and projects.
        </p>
      </header>
      <UserProfileForm mode="create" userId={uId} />
    </article>
  )
}
