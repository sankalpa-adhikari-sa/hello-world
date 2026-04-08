import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_public/events/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_public/events/$id"!</div>
}
