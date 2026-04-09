import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/u/$uId/profile')({
  component: RouteComponent,
})

function RouteComponent() {
  return <Outlet />
}
