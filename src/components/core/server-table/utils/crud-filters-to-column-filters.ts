import { isConditionalFilter, isLogicalFilter } from '../types'
import type { ColumnDef, ColumnFilter } from '@tanstack/react-table'

import type { CrudFilter } from '../types'

type Params<TData> = {
  columns: Array<ColumnDef<TData, unknown>>
  crudFilters: Array<CrudFilter>
}

export const crudFiltersToColumnFilters = <TData = unknown>({
  columns,
  crudFilters,
}: Params<TData>): Array<ColumnFilter> => {
  return crudFilters
    .map((filter) => {
      if (isConditionalFilter(filter)) {
        if (filter.key) {
          const filterId: string =
            columns.find(
              (col) =>
                (col.meta as { filterKey?: string })?.filterKey === filter.key,
            )?.id ?? filter.key

          return {
            id: filterId,
            operator: filter.operator,
            value: filter.value,
          }
        }
        return undefined
      }

      if (isLogicalFilter(filter)) {
        return {
          id: filter.field,
          operator: filter.operator,
          value: filter.value,
        }
      }

      return undefined
    })
    .filter(Boolean) as Array<ColumnFilter>
}
