import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/orgs/$orgId/settings')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/(main)/orgs/$orgId/settings"!</div>
}
