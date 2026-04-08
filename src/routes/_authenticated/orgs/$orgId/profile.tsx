import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/orgs/$orgId/profile')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_main/orgs/$orgId/profile"!</div>
}
