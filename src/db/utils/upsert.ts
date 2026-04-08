import { sql } from 'drizzle-orm/sql'
import { getTableColumns } from 'drizzle-orm/utils'
import type { PgTable } from 'drizzle-orm/pg-core'
import type { SQL } from 'drizzle-orm/sql'

export const buildConflictUpdateColumns = <
  T extends PgTable,
  Q extends keyof T['_']['columns'],
>(
  table: T,
  columns: Array<Q>,
) => {
  const cls = getTableColumns(table)

  return columns.reduce(
    (acc, column) => {
      const colName = cls[column]?.name
      acc[column] = sql.raw(`excluded.${colName}`)
      return acc
    },
    {} as Record<Q, SQL>,
  )
}
