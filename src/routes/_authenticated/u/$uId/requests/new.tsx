import { createFileRoute } from '@tanstack/react-router'

import { RequestForm } from '@/components/core/requests/request-form'

export const Route = createFileRoute('/_authenticated/u/$uId/requests/new')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <article className="border-border border-b">
      <header className="border-border border-b px-6 py-4">
        <h1 className="text-lg font-bold uppercase tracking-tight">
          New request
        </h1>
        <p className="text-muted-foreground mt-1 text-xs">
          Describe what you need; content is stored as JSON (e.g. TipTap doc or
          metadata).
        </p>
      </header>
      <RequestForm mode="create" />
    </article>
  )
}
