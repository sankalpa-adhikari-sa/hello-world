import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/u/$uId/fundme')({
  component: RouteComponent,
})

function RouteComponent() {
  const { uId } = Route.useParams()
  return (
    <div className="space-y-4 p-6">
      <p>Students can showcase their projects for raising funds.</p>
      <Link
        to="/u/$uId/fund-a-project/new"
        params={{ uId }}
        className="text-primary text-sm font-medium underline underline-offset-4"
      >
        Start a new campaign
      </Link>
    </div>
  )
}
