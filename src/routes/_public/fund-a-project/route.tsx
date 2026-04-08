import { Outlet, createFileRoute } from '@tanstack/react-router'

/**
 * Layout so list search params (`index`) are not inherited by `/fund-a-project/$id`.
 */
export const Route = createFileRoute('/_public/fund-a-project')({
  component: FundAProjectLayout,
})

function FundAProjectLayout() {
  return <Outlet />
}
