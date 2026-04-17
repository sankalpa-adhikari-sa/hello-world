import { useEffect } from "react";
import isEqual from "lodash-es/isEqual";
import {
  useReactTable,
  type Table,
  type TableOptions,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";

import type { BaseRecord, CrudFilter, CrudSort } from "./types";
import {
  columnFiltersToCrudFilters,
  crudFiltersToColumnFilters,
  getRemovedFilters,
} from "./utils/index";
import { useIsFirstRender } from "./useIsFirstRender";
import type { UseTableStateReturn } from "./useTableState";

export type UseDataTableProps<TData extends BaseRecord = BaseRecord> = {
  /** Row data (typically the `data` field of your list query). */
  data: TData[];
  /** Total row count for server pagination (from your API). */
  total: number | undefined;
  /** Return value of {@link useTableState} — keeps this hook compatible with the Rules of Hooks. */
  table: UseTableStateReturn;
} & Pick<TableOptions<TData>, "columns"> &
  Partial<Omit<TableOptions<TData>, "columns">>;

export type UseDataTableReturn<TData extends BaseRecord = BaseRecord> = {
  reactTable: Table<TData>;
};

/**
 * Bridges {@link useTableState} with TanStack Table (manual pagination / sorting / filtering).
 * Use `table.getServerListParams()` in your data layer (e.g. TanStack Query `queryKey` / `queryFn`).
 */
export function useDataTable<TData extends BaseRecord = BaseRecord>({
  data,
  total,
  table,
  initialState: reactTableInitialState = {},
  ...rest
}: UseDataTableProps<TData>): UseDataTableReturn<TData> {
  const isFirstRender = useIsFirstRender();

  const isServerSideFilteringEnabled = table.modes.filters === "server";
  const isServerSideSortingEnabled = table.modes.sorters === "server";
  const isPaginationEnabled = table.modes.pagination !== "off";

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    sorters,
    setSorters,
    filters: filtersCore,
    setFilters,
  } = table;

  const pageCount = pageSize
    ? Math.ceil((total ?? 0) / pageSize)
    : 1;

  const reactTableResult = useReactTable<TData>({
    data,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: isServerSideSortingEnabled
      ? undefined
      : getSortedRowModel(),
    getFilteredRowModel: isServerSideFilteringEnabled
      ? undefined
      : getFilteredRowModel(),
    initialState: {
      pagination: {
        pageIndex: currentPage - 1,
        pageSize,
      },
      sorting: sorters.map((sorting) => ({
        id: sorting.field,
        desc: sorting.order === "desc",
      })),
      columnFilters: crudFiltersToColumnFilters<TData>({
        columns: rest.columns,
        crudFilters: filtersCore,
      }),
      ...reactTableInitialState,
    },
    pageCount,
    manualPagination: true,
    manualSorting: isServerSideSortingEnabled,
    manualFiltering: isServerSideFilteringEnabled,
    ...rest,
  });

  const { state, columns } = reactTableResult.options;
  const { pagination, sorting, columnFilters } = state;

  const { pageIndex, pageSize: rtPageSize } = pagination ?? {};

  useEffect(() => {
    if (pageIndex !== undefined) {
      setCurrentPage(pageIndex + 1);
    }
  }, [pageIndex, setCurrentPage]);

  useEffect(() => {
    if (rtPageSize !== undefined) {
      setPageSize(rtPageSize);
    }
  }, [rtPageSize, setPageSize]);

  useEffect(() => {
    if (sorting !== undefined) {
      const newSorters: CrudSort[] = sorting.map((s) => ({
        field: s.id,
        order: s.desc ? "desc" : "asc",
      }));

      if (!isEqual(sorters, newSorters)) {
        setSorters(newSorters);
      }

      if (sorting.length > 0 && isPaginationEnabled && !isFirstRender) {
        setCurrentPage(1);
      }
    }
  }, [
    sorting,
    sorters,
    setSorters,
    isPaginationEnabled,
    isFirstRender,
    setCurrentPage,
  ]);

  useEffect(() => {
    const allColumns = reactTableResult
      .getAllColumns()
      .map((col) => col.columnDef);

    const crudFilters: CrudFilter[] = columnFiltersToCrudFilters<TData>({
      columns: allColumns,
      columnFilters,
    });

    crudFilters.push(
      ...getRemovedFilters({
        nextFilters: crudFilters,
        coreFilters: filtersCore,
      }),
    );

    if (!isEqual(crudFilters, filtersCore)) {
      setFilters(crudFilters);
    }

    if (crudFilters.length > 0 && isPaginationEnabled && !isFirstRender) {
      setCurrentPage(1);
    }
  }, [
    columnFilters,
    columns,
    reactTableResult,
    filtersCore,
    setFilters,
    isPaginationEnabled,
    isFirstRender,
    setCurrentPage,
  ]);

  return {
    reactTable: reactTableResult,
  };
}
