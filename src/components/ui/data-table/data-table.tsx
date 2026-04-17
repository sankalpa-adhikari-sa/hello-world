import * as React from 'react'
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
import type { ReactNode } from 'react'
import type {
  ColumnDef,
  ColumnFiltersState,
  OnChangeFn,
  PaginationState,
  SortingState,
  Table as TanStackTable,
  VisibilityState,
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
  /**
   * When set, layout uses this table instance (e.g. from `useDataTable` + `useTableState`)
   * instead of creating an internal `useReactTable`.
   */
  externalTable?: TanStackTable<TData>
}

type DataTableInnerProps<TData, TValue> = Omit<
  DataTableProps<TData, TValue>,
  'externalTable' | 'columns' | 'data' | 'pagination' | 'onPaginationChange'
> & {
  table: TanStackTable<TData>
  /** Used only for empty-state colspan when no headers render. */
  columnCount: number
}

function DataTableInner<TData, TValue>({
  table,
  columnCount,
  tableSearchColumn,
  filterOptions,
  renderMobileCard,
  viewMode = 'responsive',
  pageSizeOptions,
  serverSearch,
  serverSort,
  serverToolbarExtras,
  listReset,
  filterPopoverMeta,
}: DataTableInnerProps<TData, TValue>) {
  const columnSizeVars = React.useMemo(() => {
    const headers = table.getFlatHeaders()
    const colSizes: { [key: string]: number } = {}
    for (const header of headers) {
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
                          width: `calc(var(--header-${header.id}-size) * 1px)`,
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
                    colSpan={Math.max(1, columnCount)}
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
            viewMode === 'mobile'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
              : 'flex flex-col gap-3',
            viewMode === 'desktop' && 'hidden',
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
      <DataTablePagination table={table} pageSizeOptions={pageSizeOptions} />
    </div>
  )
}

function DataTableWithInternalTable<TData, TValue>({
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
}: Omit<DataTableProps<TData, TValue>, 'externalTable'>) {
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

  const table: TanStackTable<TData> = useReactTable({
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

  return (
    <DataTableInner
      table={table}
      columnCount={columns.length}
      tableSearchColumn={tableSearchColumn}
      filterOptions={filterOptions}
      renderMobileCard={renderMobileCard}
      viewMode={viewMode}
      pageSizeOptions={pageSizeOptions}
      serverSearch={serverSearch}
      serverSort={serverSort}
      serverToolbarExtras={serverToolbarExtras}
      listReset={listReset}
      filterPopoverMeta={filterPopoverMeta}
    />
  )
}

export function DataTable<TData, TValue>({
  externalTable,
  columns,
  ...rest
}: DataTableProps<TData, TValue>) {
  if (externalTable) {
    return (
      <DataTableInner
        table={externalTable}
        columnCount={columns.length}
        tableSearchColumn={rest.tableSearchColumn}
        filterOptions={rest.filterOptions}
        renderMobileCard={rest.renderMobileCard}
        viewMode={rest.viewMode}
        pageSizeOptions={rest.pageSizeOptions}
        serverSearch={rest.serverSearch}
        serverSort={rest.serverSort}
        serverToolbarExtras={rest.serverToolbarExtras}
        listReset={rest.listReset}
        filterPopoverMeta={rest.filterPopoverMeta}
      />
    )
  }

  return <DataTableWithInternalTable columns={columns} {...rest} />
}
