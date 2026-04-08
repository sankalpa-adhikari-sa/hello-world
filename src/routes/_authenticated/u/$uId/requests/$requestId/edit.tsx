import { createFileRoute } from '@tanstack/react-router'

import { RequestForm } from '@/components/core/requests/request-form'

export const Route = createFileRoute(
  '/_authenticated/u/$uId/requests/$requestId/edit',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { requestId } = Route.useParams()
  return (
    <article className="border-border border-b">
      <header className="border-border border-b px-6 py-4">
        <h1 className="text-lg font-bold uppercase tracking-tight">
          Edit request
        </h1>
        <p className="text-muted-foreground mt-1 text-xs">
          Update fields or replace tags; saving sends the full tag selection.
        </p>
      </header>
      <RequestForm mode="edit" requestId={requestId} />
    </article>
  )
}
