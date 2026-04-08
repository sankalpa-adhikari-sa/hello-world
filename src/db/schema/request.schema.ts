import { relations } from 'drizzle-orm'
import {
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { user } from './auth.schema'
import { requestType } from './enums.schema'
import { tags } from './tags.schema'

export const request = pgTable('request', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  requestType: requestType('request_type'),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  content: jsonb('content').$type<Record<string, any>>().notNull(),
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

export const requestTags = pgTable(
  'request_tags',
  {
    requestId: uuid('request_id')
      .notNull()
      .references(() => request.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.requestId, t.tagId] })],
)

export const requestRelations = relations(request, ({ one, many }) => ({
  createdBy: one(user, {
    fields: [request.createdById],
    references: [user.id],
  }),
  requestTags: many(requestTags),
}))

export const requestTagsRelations = relations(requestTags, ({ one }) => ({
  request: one(request, {
    fields: [requestTags.requestId],
    references: [request.id],
  }),
  tag: one(tags, {
    fields: [requestTags.tagId],
    references: [tags.id],
  }),
}))
