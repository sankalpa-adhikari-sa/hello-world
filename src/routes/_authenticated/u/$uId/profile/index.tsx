import { useSuspenseQuery } from '@tanstack/react-query'
import {
  createFileRoute,
  getRouteApi,
  useNavigate,
} from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getCurrentUserProfileQO } from '@/sfn/users'

const authenticatedRouteApi = getRouteApi('/_authenticated')

export const Route = createFileRoute('/_authenticated/u/$uId/profile/')({
  component: RouteComponent,
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      getCurrentUserProfileQO({ userId: params.uId }),
    )
  },
})

function RouteComponent() {
  const { uId } = Route.useParams()
  const navigate = useNavigate()
  const { data: profile } = useSuspenseQuery(
    getCurrentUserProfileQO({ userId: uId }),
  )
  const { currentUser: authBundle } = authenticatedRouteApi.useLoaderData()
  const sessionUserId = authBundle.currentUser.id
  const isOwner = sessionUserId === uId

  if (!profile) {
    return (
      <article className="space-y-4 p-6">
        <h1 className="text-lg font-bold uppercase tracking-tight">Profile</h1>
        <p className="text-muted-foreground text-sm">
          This profile has not been created yet.
        </p>
        {isOwner ? (
          <Button
            className="cursor-pointer"
            onClick={() =>
              navigate({ to: '/u/$uId/profile/new', params: { uId } })
            }
          >
            Create profile
          </Button>
        ) : null}
      </article>
    )
  }

  return (
    <article className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-bold uppercase tracking-tight">Profile</h1>
        {isOwner ? (
          <Button
            variant="outline"
            className="cursor-pointer"
            onClick={() =>
              navigate({ to: '/u/$uId/profile/edit', params: { uId } })
            }
          >
            Edit profile
          </Button>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            {profile.displayName || authBundle.currentUser.name}
          </CardTitle>
          {profile.headline ? (
            <p className="text-muted-foreground text-sm">{profile.headline}</p>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {profile.bio ? <p>{profile.bio}</p> : null}
          {profile.websiteUrl ? (
            <p>
              Website:{' '}
              <a
                href={profile.websiteUrl}
                className="text-primary underline underline-offset-4"
                rel="noreferrer"
                target="_blank"
              >
                {profile.websiteUrl}
              </a>
            </p>
          ) : null}
          {profile.location ? <p>Location: {profile.location}</p> : null}
          <p>Student: {profile.isStudent ? 'Yes' : 'No'}</p>
          {profile.isStudent && profile.studentMajor ? (
            <p>Major: {profile.studentMajor}</p>
          ) : null}
          {profile.isStudent && profile.studentGraduationYear ? (
            <p>Graduation year: {profile.studentGraduationYear}</p>
          ) : null}
        </CardContent>
      </Card>
    </article>
  )
}
