import { Outlet, createFileRoute } from '@tanstack/react-router'

/**
 * Layout so list search params (`index`) are not inherited by `/requests/$id`.
 */
export const Route = createFileRoute('/_public/requests')({
  component: RequestsLayout,
})

function RequestsLayout() {
  return <Outlet />
}
