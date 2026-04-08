import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/u/$uId/settings')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/(main)/(users)/settings"!</div>
}
