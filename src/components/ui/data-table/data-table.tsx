import * as React from 'react'
import type { ReactNode } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { DataTablePagination } from './data-table-pagination'
import { DataTableToolbar } from './data-table-toolbar'
import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  OnChangeFn,
  PaginationState,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

interface DataTableProps<TData, TValue> {
  columns: Array<ColumnDef<TData, TValue>>
  data: Array<TData>
  tableSearchColumn: string
  filename?: string
  filterOptions?: Array<{
    title: string
    column_name: string
    icon?: React.ComponentType<{ className?: string }>
    variant?: 'multiple' | 'single'
    data: Array<{ label: string; value: string }>
  }>
  renderMobileCard?: (row: TData) => React.ReactNode
  viewMode?: 'responsive' | 'desktop' | 'mobile'
  // Server-side pagination props
  rowCount?: number
  /** When set, pagination is controlled by the parent (e.g. URL + server fetch). */
  pagination?: PaginationState
  onPaginationChange?: OnChangeFn<PaginationState>
  pageSizeOptions?: Array<number>
  /** Binds toolbar search to parent state; enables `manualFiltering` so rows are not filtered client-side. */
  serverSearch?: {
    value: string
    onChange: (value: string) => void
    /** When set, search uses an input group with a search button and Enter to submit (e.g. URL-backed `q`). */
    onSubmit?: () => void
  }
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
  /** Summary for the filters popover trigger (server / URL filters outside column state). */
  filterPopoverMeta?: {
    summary: string
    activeCount: number
  }
}

export function DataTable<TData, TValue>({
  columns,
  data,
  filterOptions,
  tableSearchColumn,
  renderMobileCard,
  viewMode = 'responsive',
  rowCount,
  pagination: controlledPagination,
  onPaginationChange,
  pageSizeOptions,
  serverSearch,
  serverSort,
  serverToolbarExtras,
  listReset,
  filterPopoverMeta,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnSizing, setColumnSizing] = React.useState({})
  const [internalPagination, setInternalPagination] =
    React.useState<PaginationState>({
      pageIndex: 0,
      pageSize: 10,
    })
  const pagination = controlledPagination ?? internalPagination

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      columnSizing,
      pagination,
    },
    defaultColumn: {
      minSize: 60,
      maxSize: 800,
      size: 150,
    },
    enableRowSelection: true,
    enableColumnResizing: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnSizingChange: setColumnSizing,
    onPaginationChange: (updater) => {
      const newPagination =
        typeof updater === 'function' ? updater(pagination) : updater
      if (controlledPagination === undefined) {
        setInternalPagination(newPagination)
      }
      onPaginationChange?.(newPagination)
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    columnResizeMode: 'onChange',
    columnResizeDirection: 'ltr',
    manualPagination: true,
    manualFiltering: serverSearch !== undefined,
    rowCount: rowCount,
  })

  const columnSizeVars = React.useMemo(() => {
    const headers = table.getFlatHeaders()
    const colSizes: { [key: string]: number } = {}
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i]!
      colSizes[`--header-${header.id}-size`] = header.getSize()
      colSizes[`--col-${header.column.id}-size`] = header.column.getSize()
    }
    return colSizes
  }, [table.getState().columnSizingInfo, table.getState().columnSizing])

  return (
    <div className="flex w-full flex-col space-y-2">
      <DataTableToolbar
        table={table}
        filterOptions={filterOptions}
        tableSearchColumn={tableSearchColumn}
        serverSearch={serverSearch}
        serverSort={serverSort}
        serverToolbarExtras={serverToolbarExtras}
        listReset={listReset}
        filterPopoverMeta={filterPopoverMeta}
      />
      <div
        className={cn(
          'flex flex-col gap-2',
          viewMode === 'mobile' && 'hidden',
          viewMode === 'responsive' && renderMobileCard && 'hidden md:flex',
        )}
      >
        <div className="w-full overflow-x-auto">
          <Table
            className="table-fixed border-separate border-spacing-0 [&_tr:not(:last-child)_td]:border-b"
            style={{
              ...columnSizeVars,
              minWidth: table.getTotalSize(),
            }}
          >
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  className="bg-sidebar rounded-lg border-none"
                  key={headerGroup.id}
                >
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        style={{
                          width: `calc(var(--header-${header?.id}-size) * 1px)`,
                        }}
                        className="bg-sidebar border-border relative h-9 border-y select-none first:rounded-l-lg first:border-l last:rounded-r-lg last:border-r"
                        key={header.id}
                        colSpan={header.colSpan}
                      >
                        <div
                          className={cn(
                            'flex h-full items-center',
                            header.column.getCanResize() && 'pr-4',
                          )}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                          {{
                            asc: '↑',
                            desc: '↓',
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                        {header.column.getCanResize() && (
                          <div
                            onDoubleClick={() => header.column.resetSize()}
                            onMouseDown={header.getResizeHandler()}
                            onTouchStart={header.getResizeHandler()}
                            onClick={(e) => e.stopPropagation()}
                            className={cn(
                              'absolute right-0 top-0 h-full w-2 cursor-col-resize bg-transparent hover:bg-primary/30 active:bg-primary/50 transition-colors touch-none -mr-1',
                              header.column.getIsResizing() && 'bg-primary/60',
                            )}
                          />
                        )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody className="border-t">
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        style={{
                          width: `calc(var(--col-${cell.column.id}-size) * 1px)`,
                        }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      {renderMobileCard && (
        <div
          className={cn(
            // Responsive grid layout for mobile cards
            viewMode === 'mobile'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
              : 'flex flex-col gap-3',
            // Hide in desktop mode
            viewMode === 'desktop' && 'hidden',
            // Hide on md+ screens in responsive mode
            viewMode === 'responsive' && 'md:hidden',
          )}
        >
          {table.getRowModel().rows.length ? (
            table
              .getRowModel()
              .rows.map((row) => (
                <div key={row.id}>{renderMobileCard(row.original)}</div>
              ))
          ) : (
            <div className="text-muted-foreground py-10 text-center text-sm">
              No results.
            </div>
          )}
        </div>
      )}
      <DataTablePagination
        table={table}
        pageSizeOptions={pageSizeOptions}
      />
    </div>
  )
}
