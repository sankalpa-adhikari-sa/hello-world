import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { OrganizationMembersPanel } from '@/components/core/organization/organization-members-panel'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ListMembersSchema,
  listOrganizationMembersQO,
} from '@/sfn/organization/members'

const authenticatedRouteApi = getRouteApi('/_authenticated')

export const Route = createFileRoute('/_authenticated/orgs/$orgId/members')({
  validateSearch: ListMembersSchema.omit({ organizationId: true }),

  loaderDeps: ({
    search: {
      limit,
      offset,
      sortBy,
      sortDirection,
      filterField,
      filterOperator,
      filterValue,
    },
  }) => ({
    limit,
    offset,
    sortBy,
    sortDirection,
    filterField,
    filterOperator,
    filterValue,
  }),

  loader: async ({ context, params, deps }) => {
    const fetchParams = {
      ...deps,
      organizationId: params.orgId,
    }
    await context.queryClient.ensureQueryData(
      listOrganizationMembersQO(fetchParams),
    )
  },

  component: RouteComponent,
})

function RouteComponent() {
  const params = Route.useParams()
  const search = Route.useSearch()
  const { currentUser } = authenticatedRouteApi.useLoaderData()

  const listParams = {
    ...search,
    organizationId: params.orgId,
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>
            Add or remove members, change roles, or leave the organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrganizationMembersPanel
            listParams={listParams}
            currentUserId={currentUser.currentUser.id}
          />
        </CardContent>
      </Card>
    </div>
  )
}
