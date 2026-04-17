/** Row type for tables; extend with your model fields. */
export type BaseRecord = {
  id?: string | number;
  [key: string]: unknown;
};

export type CrudOperators =
  | "eq"
  | "ne"
  | "eqs"
  | "nes"
  | "lt"
  | "gt"
  | "lte"
  | "gte"
  | "in"
  | "nin"
  | "ina"
  | "nina"
  | "contains"
  | "ncontains"
  | "containss"
  | "ncontainss"
  | "between"
  | "nbetween"
  | "null"
  | "nnull"
  | "startswith"
  | "nstartswith"
  | "startswiths"
  | "nstartswiths"
  | "endswith"
  | "nendswith"
  | "endswiths"
  | "nendswiths"
  | "or"
  | "and";

export type LogicalFilter = {
  field: string;
  operator: Exclude<CrudOperators, "or" | "and">;
  value: unknown;
};

export type ConditionalFilter = {
  key?: string;
  operator: Extract<CrudOperators, "or" | "and">;
  value: (LogicalFilter | ConditionalFilter)[];
};

export type CrudFilter = LogicalFilter | ConditionalFilter;

export type SortOrder = "desc" | "asc" | null;

export type CrudSort = {
  field: string;
  order: "asc" | "desc";
};

export type CrudSorting = CrudSort[];

export interface Pagination {
  currentPage?: number;
  pageSize?: number;
  mode?: "client" | "server" | "off";
}
