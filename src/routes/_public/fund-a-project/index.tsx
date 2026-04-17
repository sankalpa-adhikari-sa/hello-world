import { useMemo } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

import LandingPageHero from '@/components/core/cards/landing'
import { FundAProjectPublicList } from '@/components/core/fund-a-project/fund-a-project-public-list'
import {
  fundAPublicSearchToListInput,
  getFundAProjectsQO,
} from '@/sfn/fund-a-project'
import { listTagsForRequestsFormQO } from '@/sfn/requests'
import { fundAPublicListSearchSchema } from '@/types/fund-a-project'

export const Route = createFileRoute('/_public/fund-a-project/')({
  validateSearch: (raw) => fundAPublicListSearchSchema.parse(raw),

  loaderDeps: ({ search }) => ({ search }),

  loader: async ({ context, deps }) => {
    const input = fundAPublicSearchToListInput(deps.search)
    await Promise.all([
      context.queryClient.ensureQueryData(getFundAProjectsQO(input)),
      context.queryClient.ensureQueryData(listTagsForRequestsFormQO()),
    ])
  },

  component: RouteComponent,
})

function RouteComponent() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  const { data: tagRows } = useSuspenseQuery(listTagsForRequestsFormQO())
  const tagOptions = useMemo(
    () => tagRows.map((t) => ({ label: t.name, value: t.id })),
    [tagRows],
  )

  return (
    <div>
      <LandingPageHero />
      <article className="space-y-4 p-3 lg:p-6">
        <FundAProjectPublicList
          navigate={navigate}
          search={search}
          tagOptions={tagOptions}
        />
      </article>
    </div>
  )
}
