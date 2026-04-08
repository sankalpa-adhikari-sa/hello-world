import { Outlet, createFileRoute } from '@tanstack/react-router'
import { TopNavHeader } from '@/components/core/navigation/header/header'

export const Route = createFileRoute('/_public')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>
      <TopNavHeader />
      <Outlet />
    </div>
  )
}
