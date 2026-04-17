/** Row type for tables; extend with your model fields. */
export type BaseRecord = {
  id?: string | number
  [key: string]: unknown
}

export type CrudOperators =
  | 'eq'
  | 'ne'
  | 'eqs'
  | 'nes'
  | 'lt'
  | 'gt'
  | 'lte'
  | 'gte'
  | 'in'
  | 'nin'
  | 'ina'
  | 'nina'
  | 'contains'
  | 'ncontains'
  | 'containss'
  | 'ncontainss'
  | 'between'
  | 'nbetween'
  | 'null'
  | 'nnull'
  | 'startswith'
  | 'nstartswith'
  | 'startswiths'
  | 'nstartswiths'
  | 'endswith'
  | 'nendswith'
  | 'endswiths'
  | 'nendswiths'
  | 'or'
  | 'and'

export type LogicalFilter = {
  field: string
  operator: Exclude<CrudOperators, 'or' | 'and'>
  value: unknown
}

export type ConditionalFilter = {
  key?: string
  operator: Extract<CrudOperators, 'or' | 'and'>
  value: Array<LogicalFilter | ConditionalFilter>
}

export type CrudFilter = LogicalFilter | ConditionalFilter

export type SortOrder = 'desc' | 'asc' | null

export type CrudSort = {
  field: string
  order: 'asc' | 'desc'
}

export type CrudSorting = Array<CrudSort>

export interface Pagination {
  currentPage?: number
  pageSize?: number
  mode?: 'client' | 'server' | 'off'
}

export interface ColumnVisibility {
  initial?: Record<string, boolean>
  permanent?: Record<string, boolean>
}

/**
 * Type guard to check if a filter is a LogicalFilter
 * @param filter - The filter to check
 * @returns true if the filter is a LogicalFilter
 */
export function isLogicalFilter(filter: CrudFilter): filter is LogicalFilter {
  return filter.operator !== 'or' && filter.operator !== 'and'
}

/**
 * Type guard to check if a filter is a ConditionalFilter
 * @param filter - The filter to check
 * @returns true if the filter is a ConditionalFilter
 */
export function isConditionalFilter(
  filter: CrudFilter,
): filter is ConditionalFilter {
  return filter.operator === 'or' || filter.operator === 'and'
}
