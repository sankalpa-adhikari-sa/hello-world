import type { ColumnDef, ColumnFilter, ColumnFiltersState } from "@tanstack/react-table";

import type { ConditionalFilter, CrudFilter, CrudOperators, LogicalFilter } from "../types";

type Params<TData> = {
  columnFilters?: ColumnFiltersState;
  columns: ColumnDef<TData, unknown>[];
};

export const columnFiltersToCrudFilters = <TData = unknown>({
  columns,
  columnFilters,
}: Params<TData>): CrudFilter[] => {
  return (
    columnFilters?.map((filter) => {
      const operator =
        (filter as ColumnFilter & { operator?: CrudOperators }).operator ??
        (
          columns.find((col) => col.id === filter.id)?.meta as {
            filterOperator?: string;
          }
        )?.filterOperator;

      const isConditional = operator === "and" || operator === "or";

      if (isConditional && Array.isArray(filter.value)) {
        const filterKey =
          (
            columns.find((c) => c.id === filter.id)?.meta as {
              filterKey?: string;
            }
          )?.filterKey ?? filter.id;

        return {
          key: filterKey,
          operator: operator as ConditionalFilter["operator"],
          value: filter.value,
        };
      }
      const defaultOperator = Array.isArray(filter.value) ? "in" : "eq";

      return {
        field: filter.id,
        operator: (operator as LogicalFilter["operator"]) ?? defaultOperator,
        value: filter.value,
      };
    }) ?? []
  );
};
