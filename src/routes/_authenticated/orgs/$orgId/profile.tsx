import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { OrganizationProfileForm } from '@/components/core/organization/settings/organization-profile-form'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { getOrganizationProfileQO } from '@/sfn/organization/profile'

const authenticatedRouteApi = getRouteApi('/_authenticated')

export const Route = createFileRoute('/_authenticated/orgs/$orgId/profile')({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      getOrganizationProfileQO(params.orgId),
    )
  },
  component: RouteComponent,
})

function RouteComponent() {
  const params = Route.useParams()
  const { data } = useSuspenseQuery(getOrganizationProfileQO(params.orgId))
  const { currentUser } = authenticatedRouteApi.useLoaderData()

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Organization profile</CardTitle>
          <CardDescription>
            Public-facing details stored in{' '}
            <code className="text-xs">organization_profile</code>. Signed in as{' '}
            {currentUser.currentUser.email}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrganizationProfileForm
            organizationId={params.orgId}
            initial={data}
          />
        </CardContent>
      </Card>
    </div>
  )
}
