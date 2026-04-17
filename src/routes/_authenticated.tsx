import { queryOptions } from '@tanstack/react-query'
import { Outlet, createFileRoute } from '@tanstack/react-router'
import { TopNavHeader } from '@/components/core/navigation/header/header'
import { authMiddleware } from '@/middleware/auth'
import { listUserOrganizationsQO } from '@/sfn/organization'
import { getCurrentUser } from '@/sfn/users'

export const Route = createFileRoute('/_authenticated')({
  component: RouteComponent,
  server: {
    middleware: [authMiddleware],
  },
  loader: async ({ context }) => {
    const currentUser = await context.queryClient.ensureQueryData(
      queryOptions({
        queryKey: ['currentUser'],
        queryFn: () => getCurrentUser(),
      }),
    )
    const userOrganizations = await context.queryClient.ensureQueryData(
      listUserOrganizationsQO(),
    )
    return {
      currentUser: currentUser,
      userOrganizations: userOrganizations,
    }
  },
})

function RouteComponent() {
  return (
    <div>
      <TopNavHeader />
      <Outlet />
    </div>
  )
}
