import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import { schema } from './schema'

/**
 * Cache the database connection in development. This avoids creating a new connection on every HMR
 * update.
 */
const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined
}

const conn = globalForDb.conn ?? postgres(process.env.DATABASE_URL!)
if (process.env.NODE_ENV !== 'production') globalForDb.conn = conn

export const db = drizzle(conn, { schema })
export * from 'drizzle-orm/sql'
export type { InferInsertModel, Table, InferSelectModel } from 'drizzle-orm'
export { alias, PgColumn } from 'drizzle-orm/pg-core'
export type { PgUpdateSetSource } from 'drizzle-orm/pg-core'
export { buildConflictUpdateColumns } from './utils/upsert'
