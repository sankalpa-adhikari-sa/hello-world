import differenceWith from 'lodash-es/differenceWith'
import unionWith from 'lodash-es/unionWith'
import qs from 'qs'
import warnOnce from 'warn-once'
import type {IStringifyOptions} from 'qs';

import type { CrudFilter, CrudOperators, CrudSort, SortOrder } from './types'

export const QS_PARSE_DEPTH = 10

export const parseTableParams = (url: string) => {
  const normalized = url.startsWith('?') ? url : `?${url}`
  const { currentPage, pageSize, sorters, filters } = qs.parse(
    normalized.substring(1),
    { depth: QS_PARSE_DEPTH },
  )

  return {
    parsedCurrentPage: currentPage && Number(currentPage),
    parsedPageSize: pageSize && Number(pageSize),
    parsedSorter: (sorters as Array<CrudSort>) || [],
    parsedFilters: (filters as Array<CrudFilter>) ?? [],
  }
}

/** For validated router search objects (same keys as the query-string form). */
export const parseTableParamsFromQuery = (params: Record<string, unknown>) => {
  const { currentPage, pageSize, sorters, filters } = params

  return {
    parsedCurrentPage: currentPage && Number(currentPage as number),
    parsedPageSize: pageSize && Number(pageSize as number),
    parsedSorter: (sorters as Array<CrudSort>) || ([] as Array<CrudSort>),
    parsedFilters: (filters as Array<CrudFilter>) ?? [],
  }
}

export const stringifyTableParams = (params: {
  pagination?: { currentPage?: number; pageSize?: number }
  sorters: Array<CrudSort>
  filters: Array<CrudFilter>
  [key: string]: unknown
}): string => {
  const options: IStringifyOptions = {
    skipNulls: true,
    arrayFormat: 'indices',
    encode: false,
  }
  const { pagination, sorters, filters, ...rest } = params

  return qs.stringify(
    {
      ...rest,
      ...(pagination ? pagination : {}),
      sorters,
      filters,
    },
    options,
  )
}

export const compareFilters = (
  left: CrudFilter,
  right: CrudFilter,
): boolean => {
  if (
    left.operator !== 'and' &&
    left.operator !== 'or' &&
    right.operator !== 'and' &&
    right.operator !== 'or'
  ) {
    return (
      ('field' in left ? left.field : undefined) ===
        ('field' in right ? right.field : undefined) &&
      left.operator === right.operator
    )
  }

  return (
    ('key' in left ? left.key : undefined) ===
      ('key' in right ? right.key : undefined) &&
    left.operator === right.operator
  )
}

export const compareSorters = (left: CrudSort, right: CrudSort): boolean =>
  left.field === right.field

export const unionFilters = (
  permanentFilter: Array<CrudFilter>,
  newFilters: Array<CrudFilter>,
  prevFilters: Array<CrudFilter> = [],
): Array<CrudFilter> => {
  const isKeyRequired = newFilters.filter(
    (f) => (f.operator === 'or' || f.operator === 'and') && !f.key,
  )

  if (isKeyRequired.length > 1) {
    warnOnce(
      true,
      '[conditionalFilters]: Multiple top-level conditional filters require a distinct `key` on each filter so they can be merged and cleared correctly.',
    )
  }

  return unionWith(
    permanentFilter,
    newFilters,
    prevFilters,
    compareFilters,
  ).filter(
    (crudFilter) =>
      crudFilter.value !== undefined &&
      crudFilter.value !== null &&
      (crudFilter.operator !== 'or' ||
        (crudFilter.operator === 'or' && crudFilter.value.length !== 0)) &&
      (crudFilter.operator !== 'and' ||
        (crudFilter.operator === 'and' && crudFilter.value.length !== 0)),
  )
}

export const unionSorters = (
  permanentSorter: Array<CrudSort>,
  newSorters: Array<CrudSort>,
): Array<CrudSort> =>
  unionWith(permanentSorter, newSorters, compareSorters).filter(
    (crudSorter) => crudSorter.order !== undefined && crudSorter.order !== null,
  )

export const setInitialFilters = (
  permanentFilter: Array<CrudFilter>,
  defaultFilter: Array<CrudFilter>,
): Array<CrudFilter> => [
  ...differenceWith(defaultFilter, permanentFilter, compareFilters),
  ...permanentFilter,
]

export const setInitialSorters = (
  permanentSorter: Array<CrudSort>,
  defaultSorter: Array<CrudSort>,
): Array<CrudSort> => [
  ...differenceWith(defaultSorter, permanentSorter, compareSorters),
  ...permanentSorter,
]

export const getDefaultSortOrder = (
  columnName: string,
  sorters?: Array<CrudSort>,
): SortOrder | undefined => {
  if (!sorters) {
    return undefined
  }

  const sortItem = sorters.find((item) => item.field === columnName)

  if (sortItem) {
    return sortItem.order as SortOrder
  }

  return undefined
}

export const getDefaultFilter = (
  columnName: string,
  filters?: Array<CrudFilter>,
  operatorType: CrudOperators = 'eq',
): CrudFilter['value'] | undefined => {
  const filter = filters?.find((f) => {
    if (f.operator !== 'or' && f.operator !== 'and' && 'field' in f) {
      const { operator, field } = f
      return field === columnName && operator === operatorType
    }
    return undefined
  })

  if (filter) {
    return filter.value || []
  }

  return undefined
}
