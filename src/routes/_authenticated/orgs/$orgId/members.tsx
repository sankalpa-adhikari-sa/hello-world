import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import {
  ListMembersSchema,
  listOrganizationMembersQO,
} from '@/sfn/organization'

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

  const membersQuery = useSuspenseQuery(
    listOrganizationMembersQO({
      ...search,
      organizationId: params.orgId,
    }),
  )

  const members = membersQuery.data

  return (
    <div>
      <h2>Members for Org: {params.orgId}</h2>
      <pre>{JSON.stringify(members, null, 2)}</pre>
    </div>
  )
}
