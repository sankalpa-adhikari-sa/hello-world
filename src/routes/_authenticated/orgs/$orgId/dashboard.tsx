import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/orgs/$orgId/dashboard')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/(main)/orgs/$orgId/dashboard"!</div>
}
