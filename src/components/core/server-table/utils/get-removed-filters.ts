import { isConditionalFilter, isLogicalFilter } from '../types'
import type { CrudFilter } from '../types'

type Params = {
  nextFilters: Array<CrudFilter>
  coreFilters: Array<CrudFilter>
}

export const getRemovedFilters = ({
  nextFilters,
  coreFilters,
}: Params): Array<CrudFilter> => {
  const removedFilters = coreFilters.filter(
    (filter) =>
      !nextFilters.some((nextFilter) => {
        const isFilterConditional = isConditionalFilter(filter)
        const isCrudFilterConditional = isConditionalFilter(nextFilter)
        const hasSameOperator = filter.operator === nextFilter.operator

        if (isFilterConditional && isCrudFilterConditional) {
          return hasSameOperator && filter.key === nextFilter.key
        }

        if (
          !isFilterConditional &&
          !isCrudFilterConditional &&
          isLogicalFilter(filter) &&
          isLogicalFilter(nextFilter)
        ) {
          return hasSameOperator && filter.field === nextFilter.field
        }

        return false
      }),
  )

  return removedFilters.map((filter) => {
    if (isConditionalFilter(filter)) {
      return {
        key: filter.key,
        operator: filter.operator,
        value: [],
      }
    }

    if (isLogicalFilter(filter)) {
      return {
        field: filter.field,
        operator: filter.operator,
        value: undefined,
      }
    }

    return filter
  })
}
