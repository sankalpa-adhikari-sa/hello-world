import { relations } from 'drizzle-orm'
import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { user } from './auth.schema'

export const tags = pgTable('tags', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  name: text('title').notNull(),
  isPublic: boolean('is_public').default(false),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', {
    mode: 'date',
    withTimezone: true,
  })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  createdById: uuid('created_by_id')
    .notNull()
    .references(() => user.id),
})

export const tagsRelations = relations(tags, ({ one }) => ({
  createdBy: one(user, {
    fields: [tags.createdById],
    references: [user.id],
  }),
}))
