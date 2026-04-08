import { createFileRoute } from '@tanstack/react-router'

import { FundAProjectForm } from '@/components/core/fund-a-project/fund-a-project-form'

export const Route = createFileRoute(
  '/_authenticated/u/$uId/fund-a-project/$fundAProjectId/edit',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { fundAProjectId } = Route.useParams()
  return (
    <article className="border-border border-b">
      <header className="border-border border-b px-6 py-4">
        <h1 className="text-lg font-bold uppercase tracking-tight">
          Edit campaign
        </h1>
        <p className="text-muted-foreground mt-1 text-xs">
          Update amounts, story, or tags; saving sends the full tag selection.
        </p>
      </header>
      <FundAProjectForm mode="edit" fundAProjectId={fundAProjectId} />
    </article>
  )
}
