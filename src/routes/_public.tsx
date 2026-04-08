import { TopNavHeader } from '@/components/core/navigation/header/header'
import { createFileRoute, Outlet } from '@tanstack/react-router'

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
