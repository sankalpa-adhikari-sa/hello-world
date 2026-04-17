import type { ReactNode } from 'react'
import { SlidersHorizontal, XIcon } from 'lucide-react'
import type { ColumnFiltersState } from '@tanstack/react-table'
import { DataTableFacetedFilter } from './data-table-faceted-filter'
import { DataTableSimpleFilter } from './data-table-simple-filter'
import type { Table } from '@tanstack/react-table'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

const DATA_TABLE_TOOLBAR_SEARCH_ID = 'data-table-toolbar-search'

function countActiveColumnFilters(filters: ColumnFiltersState): number {
  return filters.filter((f) => {
    const v = f.value
    if (v === undefined || v === null) return false
    if (Array.isArray(v)) return v.length > 0
    if (typeof v === 'string') return v.trim().length > 0
    return true
  }).length
}

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  tableSearchColumn: string
  serverSearch?: {
    value: string
    onChange: (value: string) => void
    onSubmit?: () => void
  }
  filterOptions?: Array<{
    title: string
    column_name: string
    icon?: React.ComponentType<{ className?: string }>
    variant?: 'multiple' | 'single'
    data: Array<{ label: string; value: string }>
    useSimpleFilter?: boolean
  }>
  sortOptions?: Array<{
    label: string
    value: string
  }>
  defaultSortValue?: string
  onSortChange?: (value: string | null) => void
  serverSort?: {
    value: string
    options: Array<{ label: string; value: string }>
    onChange: (value: string) => void
  }
  serverToolbarExtras?: ReactNode
  listReset?: {
    active: boolean
    onReset: () => void
  }
  filterPopoverMeta?: {
    summary: string
    activeCount: number
  }
}

const sortTriggerClass =
  'h-8 min-w-[8.5rem] w-[min(100%,10.5rem)] sm:w-40 shrink-0'

export function DataTableToolbar<TData>({
  table,
  filterOptions,
  tableSearchColumn,
  serverSearch,
  sortOptions,
  defaultSortValue,
  onSortChange,
  serverSort,
  serverToolbarExtras,
  listReset,
  filterPopoverMeta,
}: DataTableToolbarProps<TData>) {
  const columnFilters = table.getState().columnFilters
  const columnFilterActiveCount = countActiveColumnFilters(columnFilters)

  const isFiltered =
    columnFilterActiveCount > 0 ||
    Boolean(serverSearch?.value.trim()) ||
    Boolean(listReset?.active)

  const hasExtras = Boolean(serverToolbarExtras)
  const hasColumnFilters = Boolean(
    filterOptions?.some((o) => table.getColumn(o.column_name)),
  )
  const hasFilterPopover = hasExtras || hasColumnFilters

  const popoverBadgeCount =
    columnFilterActiveCount + (filterPopoverMeta?.activeCount ?? 0)

  const searchControl = serverSearch?.onSubmit ? (
    <InputGroup className="h-8 w-full min-w-0">
      <InputGroupInput
        id={DATA_TABLE_TOOLBAR_SEARCH_ID}
        placeholder="Search title or subtitle…"
        value={serverSearch.value}
        onChange={(e) => serverSearch.onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            serverSearch.onSubmit?.()
          }
        }}
        aria-label="Search table"
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          className="shadow-sm"
          variant="default"
          aria-label="Search"
          onClick={() => serverSearch.onSubmit?.()}
        >
          Search
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  ) : (
    <Input
      id={DATA_TABLE_TOOLBAR_SEARCH_ID}
      placeholder="Search"
      value={
        serverSearch
          ? serverSearch.value
          : ((table.getColumn(tableSearchColumn)?.getFilterValue() as
              | string
              | undefined) ?? '')
      }
      onChange={(event) =>
        serverSearch
          ? serverSearch.onChange(event.target.value)
          : table
              .getColumn(tableSearchColumn)
              ?.setFilterValue(event.target.value)
      }
      className="h-8 w-full min-w-0"
    />
  )

  const sortControl = serverSort ? (
    <div className="min-w-0 flex flex-col">
      <Label
        htmlFor="data-table-sort"
        className="mb-1.5 hidden text-sm font-medium md:block"
      >
        Sort
      </Label>
      <Select
        value={serverSort.value}
        onValueChange={(value) => {
          if (value != null) serverSort.onChange(value)
        }}
      >
        <SelectTrigger id="data-table-sort" className={sortTriggerClass}>
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent>
          {serverSort.options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  ) : sortOptions?.length && onSortChange ? (
    <div className="min-w-0 flex flex-col">
      <Label
        htmlFor="data-table-sort-legacy"
        className="mb-1.5 hidden text-sm font-medium md:block"
      >
        Sort
      </Label>
      <Select defaultValue={defaultSortValue} onValueChange={onSortChange}>
        <SelectTrigger id="data-table-sort-legacy" className={sortTriggerClass}>
          <SelectValue placeholder="Sort" />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  ) : null

  const filterControls =
    filterOptions
      ?.filter((option) => table.getColumn(option.column_name))
      .map((option) => (
        <div key={option.column_name} className="min-w-0">
          {option.useSimpleFilter ? (
            <DataTableSimpleFilter
              column={table.getColumn(option.column_name)}
              title={option.title}
              options={option.data}
              variant={option.variant}
            />
          ) : (
            <DataTableFacetedFilter
              column={table.getColumn(option.column_name)}
              title={option.title}
              options={option.data}
              icon={option.icon}
              variant={option.variant}
            />
          )}
        </div>
      )) ?? null

  return (
    <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-end md:justify-between md:gap-4">
      <div className="min-w-0 w-full md:min-w-0 md:max-w-xl md:flex-1 lg:max-w-2xl">
        <Label
          htmlFor={DATA_TABLE_TOOLBAR_SEARCH_ID}
          className="mb-1.5 hidden text-sm font-medium md:block"
        >
          Search
        </Label>
        {searchControl}
      </div>

      <div className="flex min-w-0 shrink-0 flex-wrap items-end justify-end gap-2">
        {sortControl}

        {hasFilterPopover ? (
          <Popover>
            <PopoverTrigger
              type="button"
              className={cn(
                'border-input bg-background hover:bg-accent/60 inline-flex h-8 max-w-[min(100%,14rem)] shrink-0 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium shadow-sm',
              )}
              aria-label={
                popoverBadgeCount > 0
                  ? `Filters (${popoverBadgeCount} active)`
                  : 'Open filters'
              }
            >
              <SlidersHorizontal className="text-muted-foreground size-3.5 shrink-0" />
              <span className="truncate">Filters</span>
              {popoverBadgeCount > 0 ? (
                <Badge
                  variant="secondary"
                  className="h-5 min-w-5 shrink-0 px-1.5 font-mono text-[10px] tabular-nums"
                >
                  {popoverBadgeCount}
                </Badge>
              ) : null}
            </PopoverTrigger>
            <PopoverContent
              align="end"
              sideOffset={6}
              className="flex max-h-[min(70dvh,26rem)] w-[min(calc(100vw-1.5rem),22rem)] flex-col gap-3 overflow-y-auto p-3 sm:p-4"
            >
              <PopoverHeader className="space-y-1.5">
                <PopoverTitle>Filters</PopoverTitle>
              </PopoverHeader>
              <div className="flex flex-col gap-4 border-t border-border/60 pt-3">
                {hasExtras ? (
                  <div className="flex flex-col gap-3">{serverToolbarExtras}</div>
                ) : null}
                {hasColumnFilters ? (
                  <div className="flex flex-col gap-3">{filterControls}</div>
                ) : null}
              </div>
            </PopoverContent>
          </Popover>
        ) : null}

        {isFiltered ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              table.resetColumnFilters()
              serverSearch?.onChange('')
              listReset?.onReset()
            }}
            className="text-muted-foreground h-8 shrink-0"
          >
            <span>Reset</span>
            <XIcon className="size-3.5 sm:ml-1" />
          </Button>
        ) : null}
      </div>
    </div>
  )
}
