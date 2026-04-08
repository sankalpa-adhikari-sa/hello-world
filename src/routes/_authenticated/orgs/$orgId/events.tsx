import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/orgs/$orgId/events')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/(main)/orgs/$orgId/events"!</div>
}
