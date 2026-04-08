import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useQuery } from '@tanstack/react-query'

import { REQUEST_TYPE } from '@/constants/enums'
import { getRequestDetailBody } from '@/lib/request-content-preview'
import type { RequestTypeValue } from '@/types/requests'
import { getRequestById } from '@/sfn/requests'
import { getOptionalCurrentUser } from '@/sfn/users'

export const Route = createFileRoute('/_public/requests/$id')({
  component: RouteComponent,
})

function requestTypeLabel(value: RequestTypeValue) {
  return REQUEST_TYPE.find((t) => t.value === value)?.label ?? value
}

function RouteComponent() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const getRequestSfn = useServerFn(getRequestById)
  const getOptionalUser = useServerFn(getOptionalCurrentUser)

  const { data: authPayload } = useQuery({
    queryKey: ['optionalCurrentUser'],
    queryFn: () => getOptionalUser(),
  })
  const sessionUserId = authPayload?.currentUser?.id ?? null

  const { data: request, isPending, isError } = useQuery({
    queryKey: ['request', id],
    queryFn: () => getRequestSfn({ data: { id } }),
  })

  if (isPending) {
    return (
      <article className="p-3 lg:p-6">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </article>
    )
  }

  if (isError || !request) {
    return (
      <article className="space-y-4 p-3 lg:p-6">
        <p className="text-destructive text-sm">Request not found.</p>
        <Button
          type="button"
          variant="outline"
          className="cursor-pointer"
          onClick={() => navigate({ to: '/requests' })}
        >
          Back to requests
        </Button>
      </article>
    )
  }

  const type = (request.requestType ?? 'collaboration') as RequestTypeValue
  const isOwner = Boolean(
    sessionUserId && request.createdById === sessionUserId,
  )

  return (
    <article className="space-y-6 p-3 lg:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          className="cursor-pointer uppercase"
          onClick={() => navigate({ to: '/requests' })}
        >
          ← All requests
        </Button>
        {isOwner && sessionUserId ? (
          <Button
            type="button"
            variant="secondary"
            className="cursor-pointer uppercase"
            onClick={() =>
              navigate({
                to: '/u/$uId/requests/$requestId/edit',
                params: { uId: sessionUserId, requestId: id },
              })
            }
          >
            Edit request
          </Button>
        ) : null}
      </div>

      <Card className="border-2 border-border shadow-sm">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge
              variant="secondary"
              className="rounded-none font-bold uppercase tracking-wider"
            >
              {requestTypeLabel(type)}
            </Badge>
            <span className="text-primary font-black uppercase tracking-tighter">
              Open request
            </span>
          </div>
          <CardTitle className="text-2xl font-black uppercase leading-tight tracking-tighter">
            {request.title}
          </CardTitle>
          {request.subtitle ? (
            <p className="text-muted-foreground text-sm font-medium">
              {request.subtitle}
            </p>
          ) : null}
          <div className="flex flex-row flex-wrap gap-2">
            {request.tags.map((t) => (
              <Badge
                key={t.id}
                variant="outline"
                className="rounded-none font-bold uppercase tracking-wider"
              >
                {t.name}
              </Badge>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="max-w-prose text-sm leading-relaxed font-medium whitespace-pre-wrap">
            {getRequestDetailBody(request)}
          </p>
          <details className="text-xs">
            <summary className="cursor-pointer font-bold uppercase tracking-wide text-muted-foreground">
              Raw content (JSON)
            </summary>
            <pre className="bg-muted mt-2 max-h-64 overflow-auto rounded-md border p-3 font-mono">
              {JSON.stringify(request.content ?? {}, null, 2)}
            </pre>
          </details>
        </CardContent>
      </Card>
    </article>
  )
}
