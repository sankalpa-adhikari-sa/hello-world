import type { ColumnDef, ColumnFilter } from "@tanstack/react-table";

import type { CrudFilter, LogicalFilter } from "../types";

type Params<TData> = {
  columns: ColumnDef<TData, unknown>[];
  crudFilters: CrudFilter[];
};

export const crudFiltersToColumnFilters = <TData = unknown>({
  columns,
  crudFilters,
}: Params<TData>): ColumnFilter[] => {
  return crudFilters
    .map((filter) => {
      if (filter.operator === "and" || filter.operator === "or") {
        if (filter.key) {
          const filterId: string =
            columns.find(
              (col) =>
                (col.meta as { filterKey?: string })?.filterKey === filter.key,
            )?.id ?? filter.key;

          return {
            id: filterId,
            operator: filter.operator,
            value: filter.value,
          };
        }
        return undefined;
      }
      return {
        id: (filter as LogicalFilter).field,
        operator: (filter as LogicalFilter).operator,
        value: filter.value,
      };
    })
    .filter(Boolean) as ColumnFilter[];
};
