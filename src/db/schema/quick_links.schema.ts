import { relations } from 'drizzle-orm'
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { user } from './auth.schema'

export const quickLinks = pgTable('quick_links', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  label: text('label').notNull(),
  link: text('link').notNull(),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', {
    mode: 'date',
    withTimezone: true,
  }).defaultNow(),
  createdById: uuid('created_by_id')
    .notNull()
    .references(() => user.id),
})

export const quickLinksRelations = relations(quickLinks, ({ one }) => ({
  createdBy: one(user, {
    fields: [quickLinks.createdById],
    references: [user.id],
  }),
}))
