import { createFileRoute } from '@tanstack/react-router'
import LandingPageHero from '@/components/core/cards/landing'
import { FundAProjectTable } from '@/components/core/fund-a-project/data-table'
import {
  fundAPublicListHasActiveFilters,
  fundAPublicSearchToListInput,
  getFundAProjectsQO,
  parseFundAPublicLevelsFromSearch,
  parseFundAPublicTagIdsFromSearch,
} from '@/sfn/fund-a-project'
import {
  fundAPublicListDefaultSearch,
  fundAPublicListSearchSchema,
  type FundProjectLevelValue,
} from '@/types/fund-a-project'
import { listTagsForRequestsFormQO } from '@/sfn/requests'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { OnChangeFn, PaginationState } from '@tanstack/react-table'
import { PAGE_SIZES } from '@/constants/generic'

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

  const [searchDraft, setSearchDraft] = useState(() => search.q ?? '')

  useEffect(() => {
    setSearchDraft(search.q ?? '')
  }, [search.q])

  const applySearch = useCallback(() => {
    const trimmed = searchDraft.trim() || undefined
    navigate({
      search: (prev) => {
        if (prev.q === trimmed) return prev
        return { ...prev, q: trimmed, page: 1 }
      },
      replace: true,
    })
  }, [navigate, searchDraft])

  const listInput = useMemo(
    () => fundAPublicSearchToListInput(search),
    [search],
  )

  const { data: fundAProjectData } = useSuspenseQuery(
    getFundAProjectsQO(listInput),
  )

  const { data: tagRows } = useSuspenseQuery(listTagsForRequestsFormQO())
  const tagOptions = useMemo(
    () => tagRows.map((t) => ({ label: t.name, value: t.id })),
    [tagRows],
  )

  const pagination = useMemo<PaginationState>(
    () => ({
      pageIndex: search.page - 1,
      pageSize: search.pageSize,
    }),
    [search.page, search.pageSize],
  )

  const onPaginationChange = useCallback<OnChangeFn<PaginationState>>(
    (updater) => {
      const next = typeof updater === 'function' ? updater(pagination) : updater
      navigate({
        search: (prev) => {
          const pageSizeChanged = prev.pageSize !== next.pageSize
          return {
            ...prev,
            pageSize: next.pageSize,
            page: pageSizeChanged ? 1 : next.pageIndex + 1,
          }
        },
      })
    },
    [navigate, pagination],
  )

  const onResetList = useCallback(() => {
    setSearchDraft('')
    navigate({ search: fundAPublicListDefaultSearch, replace: true })
  }, [navigate])

  const fundListUrl = useMemo(
    () => ({
      sort: search.sort,
      onSortChange: (sort: typeof search.sort) =>
        navigate({ search: (p) => ({ ...p, sort, page: 1 }) }),
      selectedLevels: parseFundAPublicLevelsFromSearch(search),
      onLevelsChange: (levels: Array<FundProjectLevelValue>) =>
        navigate({
          search: (p) => ({
            ...p,
            levels: levels.length ? levels.join(',') : undefined,
            page: 1,
          }),
        }),
      selectedTagIds: parseFundAPublicTagIdsFromSearch(search),
      onTagIdsChange: (tagIds: string[]) =>
        navigate({
          search: (p) => ({
            ...p,
            tags: tagIds.length ? tagIds.join(',') : undefined,
            page: 1,
          }),
        }),
      featuredOnly: search.featured === true,
      onFeaturedOnlyChange: (on: boolean) =>
        navigate({
          search: (p) => ({
            ...p,
            featured: on ? true : undefined,
            page: 1,
          }),
        }),
      tagOptions,
      hasActiveFilters: fundAPublicListHasActiveFilters(search),
      onResetList,
    }),
    [navigate, onResetList, search, tagOptions],
  )

  return (
    <div>
      <LandingPageHero />
      <article className="space-y-4 p-3 lg:p-6">
        <div className="border-b-3 flex flex-row flex-wrap items-center justify-between gap-2 pb-2">
          <h1 className="text-lg font-bold uppercase">Projects</h1>
          <span className="text-primary text-lg font-bold">
            {fundAProjectData.total} total
          </span>
        </div>
        <FundAProjectTable
          data={fundAProjectData}
          pagination={pagination}
          pageSizeOptions={[...PAGE_SIZES]}
          onPaginationChange={onPaginationChange}
          searchQuery={searchDraft}
          onSearchQueryChange={setSearchDraft}
          onSearchSubmit={applySearch}
          fundListUrl={fundListUrl}
        />
      </article>
    </div>
  )
}
