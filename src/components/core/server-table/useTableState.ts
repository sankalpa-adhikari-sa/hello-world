import {
  
  
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react'
import differenceWith from 'lodash-es/differenceWith'
import isEqual from 'lodash-es/isEqual'

import {
  parseTableParams,
  setInitialFilters,
  setInitialSorters,
  unionFilters,
  unionSorters,
} from './table-params'
import { useDebouncedCallback } from './utils/debounce'
import type {Dispatch, SetStateAction} from 'react';
import type {
  ColumnVisibility,
  CrudFilter,
  CrudSort,
  Pagination,
} from './types'

type SetFilterBehavior = 'merge' | 'replace'

export type TableStateSyncPayload = {
  currentPage: number
  pageSize: number
  sorters: Array<CrudSort>
  filters: Array<CrudFilter>
}

export type UseTableStateProps = {
  pagination?: Pagination
  sorters?: {
    initial?: Array<CrudSort>
    permanent?: Array<CrudSort>
    mode?: 'server' | 'off'
  }
  filters?: {
    initial?: Array<CrudFilter>
    permanent?: Array<CrudFilter>
    defaultBehavior?: SetFilterBehavior
    mode?: 'server' | 'off'
  }
  columnVisibilityConfig?: ColumnVisibility
  /**
   * When true, initial values (and updates when `searchString` changes) are derived
   * from query strings parsed with `parseTableParams` (nested `qs` format).
   */
  syncWithSearch?: boolean
  /**
   * Current search string (`?page=1&...` or `page=1&...`). Used when `syncWithSearch` is true.
   */
  searchString?: string
  /**
   * Called after pagination, sorting, or filtering changes — use to persist state in the URL
   * (e.g. `navigate({ search: stringifyTableParams(...) })`).
   */
  onStateChange?: (payload: TableStateSyncPayload) => void
  /**
   * Optional delay in milliseconds for debouncing filter changes.
   * Set to 0 to disable debouncing. Default: 0 (no debouncing).
   */
  debounceDelay?: number
}

export type UseTableStateReturn = {
  modes: {
    filters: 'server' | 'off'
    sorters: 'server' | 'off'
    pagination: NonNullable<Pagination['mode']>
  }
  sorters: Array<CrudSort>
  setSorters: (sorters: Array<CrudSort>) => void
  filters: Array<CrudFilter>
  setFilters: ((filters: Array<CrudFilter>, behavior?: SetFilterBehavior) => void) &
    ((setter: (prevFilters: Array<CrudFilter>) => Array<CrudFilter>) => void)
  currentPage: number
  setCurrentPage: Dispatch<SetStateAction<number>>
  pageSize: number
  setPageSize: Dispatch<SetStateAction<number>>
  columnVisibility: Record<string, boolean>
  setColumnVisibility: Dispatch<SetStateAction<Record<string, boolean>>>
  /** Arguments suitable for a list API when using server-side modes. */
  getServerListParams: () => {
    pagination: {
      currentPage: number
      pageSize: number
      mode?: Pagination['mode']
    }
    filters: Array<CrudFilter> | undefined
    sorters: Array<CrudSort> | undefined
  }
}

const defaultPermanentFilter: Array<CrudFilter> = []
const defaultPermanentSorter: Array<CrudSort> = []
const defaultPermanentColumnVisibility: Record<string, boolean> = {}

function normalizeSearchString(search?: string): string {
  if (search === undefined || search === '') {
    return '?'
  }
  return search.startsWith('?') ? search : `?${search}`
}

/**
 * Pagination, sorting, and CRUD-style filter state for server-driven tables.
 * Pair with TanStack Query (or any data layer); wire `onStateChange` / `searchString` to your router.
 */
export function useTableState({
  pagination,
  filters: filtersFromProp,
  sorters: sortersFromProp,
  columnVisibilityConfig,
  syncWithSearch = false,
  searchString,
  onStateChange,
  debounceDelay = 0,
}: UseTableStateProps = {}): UseTableStateReturn {
  const isServerSideFilteringEnabled =
    (filtersFromProp?.mode || 'server') === 'server'
  const isServerSideSortingEnabled =
    (sortersFromProp?.mode || 'server') === 'server'
  const prefferedCurrentPage = pagination?.currentPage
  const prefferedPageSize = pagination?.pageSize

  const preferredInitialFilters = filtersFromProp?.initial
  const preferredPermanentFilters =
    filtersFromProp?.permanent ?? defaultPermanentFilter

  const preferredInitialSorters = sortersFromProp?.initial
  const preferredPermanentSorters =
    sortersFromProp?.permanent ?? defaultPermanentSorter

  const prefferedFilterBehavior = filtersFromProp?.defaultBehavior ?? 'merge'

  const preferredInitialColumnVisibility = columnVisibilityConfig?.initial ?? {}
  const preferredPermanentColumnVisibility =
    columnVisibilityConfig?.permanent ?? defaultPermanentColumnVisibility

  const parsed = useMemo(() => {
    if (!syncWithSearch) {
      return {
        parsedCurrentPage: undefined as number | undefined,
        parsedPageSize: undefined as number | undefined,
        parsedSorter: [] as Array<CrudSort>,
        parsedFilters: [] as Array<CrudFilter>,
      }
    }
    return parseTableParams(normalizeSearchString(searchString))
  }, [syncWithSearch, searchString])

  let defaultCurrentPage: number
  let defaultPageSize: number
  let defaultSorter: Array<CrudSort> | undefined
  let defaultFilter: Array<CrudFilter> | undefined

  if (syncWithSearch) {
    const { parsedCurrentPage, parsedPageSize, parsedSorter, parsedFilters } =
      parsed
    defaultCurrentPage = parsedCurrentPage || prefferedCurrentPage || 1
    defaultPageSize = parsedPageSize || prefferedPageSize || 10
    defaultSorter =
      parsedSorter.length > 0 ? parsedSorter : preferredInitialSorters
    defaultFilter =
      parsedFilters.length > 0 ? parsedFilters : preferredInitialFilters
  } else {
    defaultCurrentPage = prefferedCurrentPage || 1
    defaultPageSize = prefferedPageSize || 10
    defaultSorter = preferredInitialSorters
    defaultFilter = preferredInitialFilters
  }

  const [sorters, setSorters] = useState<Array<CrudSort>>(
    setInitialSorters(preferredPermanentSorters, defaultSorter ?? []),
  )
  const [filters, setFilters] = useState<Array<CrudFilter>>(
    setInitialFilters(preferredPermanentFilters, defaultFilter ?? []),
  )
  const [currentPage, setCurrentPage] = useState<number>(defaultCurrentPage)
  const [pageSize, setPageSize] = useState<number>(defaultPageSize)
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(() => ({
    ...preferredPermanentColumnVisibility,
    ...preferredInitialColumnVisibility,
  }))

  useEffect(() => {
    if (!syncWithSearch) {
      return
    }
    if (searchString === '') {
      setCurrentPage(prefferedCurrentPage || 1)
      setPageSize(prefferedPageSize || 10)
      setSorters(
        setInitialSorters(
          preferredPermanentSorters,
          preferredInitialSorters ?? [],
        ),
      )
      setFilters(
        setInitialFilters(
          preferredPermanentFilters,
          preferredInitialFilters ?? [],
        ),
      )
      return
    }
    if (searchString === undefined) {
      return
    }
    const { parsedCurrentPage, parsedPageSize, parsedSorter, parsedFilters } =
      parseTableParams(normalizeSearchString(searchString))

    setCurrentPage(parsedCurrentPage || prefferedCurrentPage || 1)
    setPageSize(parsedPageSize || prefferedPageSize || 10)
    setSorters(
      setInitialSorters(
        preferredPermanentSorters,
        parsedSorter.length ? parsedSorter : (preferredInitialSorters ?? []),
      ),
    )
    setFilters(
      setInitialFilters(
        preferredPermanentFilters,
        parsedFilters.length ? parsedFilters : (preferredInitialFilters ?? []),
      ),
    )
  }, [
    searchString,
    syncWithSearch,
    prefferedCurrentPage,
    prefferedPageSize,
    preferredPermanentSorters,
    preferredPermanentFilters,
    preferredInitialSorters,
    preferredInitialFilters,
  ])

  useEffect(() => {
    if (!onStateChange) {
      return
    }
    onStateChange({
      currentPage,
      pageSize,
      sorters: differenceWith(sorters, preferredPermanentSorters, isEqual),
      filters: differenceWith(filters, preferredPermanentFilters, isEqual),
    })
  }, [
    onStateChange,
    currentPage,
    pageSize,
    sorters,
    filters,
    preferredPermanentSorters,
    preferredPermanentFilters,
  ])

  const setFiltersAsMerge = useCallback(
    (newFilters: Array<CrudFilter>) => {
      setFilters((prevFilters) =>
        unionFilters(preferredPermanentFilters, newFilters, prevFilters),
      )
    },
    [preferredPermanentFilters],
  )

  const setFiltersAsReplace = useCallback(
    (newFilters: Array<CrudFilter>) => {
      setFilters(unionFilters(preferredPermanentFilters, newFilters))
    },
    [preferredPermanentFilters],
  )

  const setFiltersWithSetter = useCallback(
    (setter: (prevFilters: Array<CrudFilter>) => Array<CrudFilter>) => {
      setFilters((prev) =>
        unionFilters(preferredPermanentFilters, setter(prev)),
      )
    },
    [preferredPermanentFilters],
  )

  // Create debounced versions if debounceDelay is provided
  const debouncedSetFiltersAsMerge = useDebouncedCallback(
    setFiltersAsMerge,
    debounceDelay,
    [preferredPermanentFilters],
  )

  const debouncedSetFiltersAsReplace = useDebouncedCallback(
    setFiltersAsReplace,
    debounceDelay,
    [preferredPermanentFilters],
  )

  const debouncedSetFiltersWithSetter = useDebouncedCallback(
    setFiltersWithSetter,
    debounceDelay,
    [preferredPermanentFilters],
  )

  const setFiltersFn: UseTableStateReturn['setFilters'] = useCallback(
    (
      setterOrFilters,
      behavior: SetFilterBehavior = prefferedFilterBehavior,
    ) => {
      // Use debounced versions if debounceDelay is provided and > 0
      const mergeFn =
        debounceDelay > 0 ? debouncedSetFiltersAsMerge : setFiltersAsMerge
      const replaceFn =
        debounceDelay > 0 ? debouncedSetFiltersAsReplace : setFiltersAsReplace
      const setterFn =
        debounceDelay > 0 ? debouncedSetFiltersWithSetter : setFiltersWithSetter

      if (typeof setterOrFilters === 'function') {
        setterFn(setterOrFilters)
      } else if (behavior === 'replace') {
        replaceFn(setterOrFilters)
      } else {
        mergeFn(setterOrFilters)
      }
    },
    [
      debouncedSetFiltersAsMerge,
      debouncedSetFiltersAsReplace,
      debouncedSetFiltersWithSetter,
      setFiltersWithSetter,
      setFiltersAsReplace,
      setFiltersAsMerge,
      prefferedFilterBehavior,
      debounceDelay,
    ],
  )

  const setSortWithUnion = useCallback(
    (newSorters: Array<CrudSort>) => {
      setSorters(() => unionSorters(preferredPermanentSorters, newSorters))
    },
    [preferredPermanentSorters],
  )

  const getServerListParams = useCallback((): ReturnType<
    UseTableStateReturn['getServerListParams']
  > => {
    return {
      pagination: { currentPage, pageSize, mode: pagination?.mode },
      filters: isServerSideFilteringEnabled
        ? unionFilters(preferredPermanentFilters, filters)
        : undefined,
      sorters: isServerSideSortingEnabled
        ? unionSorters(preferredPermanentSorters, sorters)
        : undefined,
    }
  }, [
    currentPage,
    pageSize,
    pagination?.mode,
    isServerSideFilteringEnabled,
    preferredPermanentFilters,
    filters,
    isServerSideSortingEnabled,
    preferredPermanentSorters,
    sorters,
  ])

  return {
    modes: {
      filters: (filtersFromProp?.mode || 'server'),
      sorters: (sortersFromProp?.mode || 'server'),
      pagination: (pagination?.mode || 'server') as NonNullable<
        Pagination['mode']
      >,
    },
    sorters,
    setSorters: setSortWithUnion,
    filters,
    setFilters: setFiltersFn,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    columnVisibility,
    setColumnVisibility,
    getServerListParams,
  }
}
