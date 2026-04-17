import type {
  CrudSort,
  TableStateSyncPayload,
  UseTableStateReturn,
} from '@/components/core/server-table'
import type {
  FundAPublicListSearch,
  GetFundAProjectsInput,
} from '@/types/fund-a-project'
import { fundAPublicSearchToListInput } from '@/sfn/fund-a-project'

const SORT_MODES: Array<FundAPublicListSearch['sort']> = [
  'newest',
  'oldest',
  'urgent',
]

/**
 * `useTableState` / `useDataTable` use `CrudSort.field` as the public list `sort` enum value.
 */
export function publicListSortToCrudSorters(
  sort: FundAPublicListSearch['sort'],
): Array<CrudSort> {
  return [{ field: sort, order: 'desc' }]
}

export function crudSortersToPublicListSort(
  sorters: Array<CrudSort>,
): FundAPublicListSearch['sort'] {
  const first = sorters.at(0)
  if (first === undefined) return 'newest'
  const mode = first.field as FundAPublicListSearch['sort']
  if (SORT_MODES.includes(mode)) return mode
  return 'newest'
}

export function fundAPublicListSearchTableSyncKey(
  search: FundAPublicListSearch,
): string {
  return JSON.stringify({
    page: search.page,
    pageSize: search.pageSize,
    sort: search.sort,
    q: search.q ?? null,
    tags: search.tags ?? null,
    levels: search.levels ?? null,
    featured: search.featured ?? null,
  })
}

function fundAPublicSearchShallowEqual(
  a: FundAPublicListSearch,
  b: FundAPublicListSearch,
): boolean {
  return (
    a.page === b.page &&
    a.pageSize === b.pageSize &&
    a.sort === b.sort &&
    a.q === b.q &&
    a.tags === b.tags &&
    a.levels === b.levels &&
    a.featured === b.featured
  )
}

export function mergeTablePayloadIntoFundAPublicSearch(
  prev: FundAPublicListSearch,
  payload: TableStateSyncPayload,
): FundAPublicListSearch {
  return {
    ...prev,
    page: payload.currentPage,
    pageSize: payload.pageSize,
    sort: crudSortersToPublicListSort(payload.sorters),
  }
}

export function shouldSkipFundAPublicNavigate(
  prev: FundAPublicListSearch,
  payload: TableStateSyncPayload,
): boolean {
  const next = mergeTablePayloadIntoFundAPublicSearch(prev, payload)
  return fundAPublicSearchShallowEqual(prev, next)
}

/**
 * Builds list API input from URL-backed search plus live `useTableState` pagination/sort
 * (so the query matches table state before the router search object catches up).
 */
export function getFundAProjectsListInputFromPublicSearchAndTable(
  search: FundAPublicListSearch,
  table: Pick<UseTableStateReturn, 'currentPage' | 'pageSize' | 'sorters'>,
): GetFundAProjectsInput {
  const fromUrl = fundAPublicSearchToListInput(search)
  return {
    ...fromUrl,
    page: table.currentPage,
    limit: table.pageSize,
    searchParam: {
      ...fromUrl.searchParam,
      sort: crudSortersToPublicListSort(table.sorters),
    },
  }
}
