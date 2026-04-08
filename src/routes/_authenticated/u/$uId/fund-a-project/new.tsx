import { createFileRoute } from '@tanstack/react-router'

import { FundAProjectForm } from '@/components/core/fund-a-project/fund-a-project-form'

export const Route = createFileRoute(
  '/_authenticated/u/$uId/fund-a-project/new',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <article className="border-border border-b">
      <header className="border-border border-b px-6 py-4">
        <h1 className="text-lg font-bold uppercase tracking-tight">
          New campaign
        </h1>
        <p className="text-muted-foreground mt-1 text-xs">
          Set a funding goal and tell your story. Rich text is stored as JSON
          under <code className="text-xs">content.story</code>; optional card
          fields live alongside it for the public grid.
        </p>
      </header>
      <FundAProjectForm mode="create" />
    </article>
  )
}
