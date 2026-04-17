import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'

import {
  fundAPublicListSearchTableSyncKey,
  getFundAProjectsListInputFromPublicSearchAndTable,
  mergeTablePayloadIntoFundAPublicSearch,
  publicListSortToCrudSorters,
  shouldSkipFundAPublicNavigate,
} from './server-table-list-adapter'
import FundAProjectTable from './data-table/fund-a-project-table'
import type { FundAListUrlControls } from './data-table/fund-a-project-table'

import type { TableStateSyncPayload } from '@/components/core/server-table'
import type {
  FundAPublicListSearch,
  FundProjectLevelValue,
} from '@/types/fund-a-project'
import { useTableState } from '@/components/core/server-table'
import { PAGE_SIZES } from '@/constants/generic'
import {
  fundAPublicListHasActiveFilters,
  getFundAProjectsQO,
  parseFundAPublicLevelsFromSearch,
  parseFundAPublicTagIdsFromSearch,
} from '@/sfn/fund-a-project'
import { fundAPublicListDefaultSearch } from '@/types/fund-a-project'

export type FundAProjectPublicListNavigate = (opts: {
  replace?: boolean
  search:
    | FundAPublicListSearch
    | ((prev: FundAPublicListSearch) => FundAPublicListSearch)
}) => void

type FundAProjectPublicListProps = {
  search: FundAPublicListSearch
  navigate: FundAProjectPublicListNavigate
  tagOptions: Array<{ label: string; value: string }>
}

export function FundAProjectPublicList({
  search,
  navigate,
  tagOptions,
}: FundAProjectPublicListProps) {
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

  return (
    <FundAProjectPublicListBody
      key={fundAPublicListSearchTableSyncKey(search)}
      applySearch={applySearch}
      navigate={navigate}
      search={search}
      searchDraft={searchDraft}
      setSearchDraft={setSearchDraft}
      tagOptions={tagOptions}
    />
  )
}

type FundAProjectPublicListBodyProps = {
  search: FundAPublicListSearch
  navigate: FundAProjectPublicListNavigate
  tagOptions: Array<{ label: string; value: string }>
  searchDraft: string
  setSearchDraft: (value: string) => void
  applySearch: () => void
}

function FundAProjectPublicListBody({
  search,
  navigate,
  tagOptions,
  searchDraft,
  setSearchDraft,
  applySearch,
}: FundAProjectPublicListBodyProps) {
  const onStateChange = useCallback(
    (payload: TableStateSyncPayload) => {
      navigate({
        replace: true,
        search: (prev) => {
          if (shouldSkipFundAPublicNavigate(prev, payload)) return prev
          return mergeTablePayloadIntoFundAPublicSearch(prev, payload)
        },
      })
    },
    [navigate],
  )

  const serverTable = useTableState({
    pagination: {
      currentPage: search.page,
      pageSize: search.pageSize,
      mode: 'server',
    },
    sorters: {
      initial: publicListSortToCrudSorters(search.sort),
      mode: 'server',
    },
    filters: { mode: 'off' },
    onStateChange,
  })

  const listInput = useMemo(
    () =>
      getFundAProjectsListInputFromPublicSearchAndTable(search, serverTable),
    [
      search,
      serverTable.currentPage,
      serverTable.pageSize,
      serverTable.sorters,
    ],
  )

  const { data: fundAProjectData } = useSuspenseQuery(
    getFundAProjectsQO(listInput),
  )

  const fundListUrl = useMemo((): FundAListUrlControls => {
    return {
      sort: search.sort,
      onSortChange: (sort) =>
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
      onTagIdsChange: (tagIds: Array<string>) =>
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
      onResetList: () => {
        setSearchDraft('')
        navigate({ search: fundAPublicListDefaultSearch, replace: true })
      },
    }
  }, [navigate, search, setSearchDraft, tagOptions])

  return (
    <>
      <div className="border-b-3 flex flex-row flex-wrap items-center justify-between gap-2 pb-2">
        <h1 className="text-lg font-bold uppercase">Projects</h1>
        <span className="text-primary text-lg font-bold">
          {fundAProjectData.total} total
        </span>
      </div>
      <FundAProjectTable
        data={fundAProjectData}
        fundListUrl={fundListUrl}
        onSearchQueryChange={setSearchDraft}
        onSearchSubmit={applySearch}
        pageSizeOptions={[...PAGE_SIZES]}
        searchQuery={searchDraft}
        serverTable={serverTable}
      />
    </>
  )
}
