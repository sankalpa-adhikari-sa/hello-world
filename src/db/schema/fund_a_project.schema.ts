import { relations } from 'drizzle-orm'
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

import { user } from './auth.schema'
import { tags } from './tags.schema'

export const fundProjectLevelEnum = pgEnum('fund_project_level', [
  'highschool',
  'undergrad',
  'grad',
])

export const fundAProject = pgTable('fund_a_project', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  targetAmount: integer('target_amount').notNull(),
  fundedAmount: integer('funded_amount').notNull(),
  isFeatured: boolean().default(false),
  projectLevel: fundProjectLevelEnum('project_level').notNull().default('undergrad'),
  coverImageUrl: text('cover_image_url'),
  coverImageAlt: text('cover_image_alt'),
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

export const fundAProjectTags = pgTable(
  'fund_a_project_tags',
  {
    fundAProjectId: uuid('fund_a_project_id')
      .notNull()
      .references(() => fundAProject.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.fundAProjectId, t.tagId] })],
)

export const fundAProjectRelations = relations(fundAProject, ({ one, many }) => ({
  createdBy: one(user, {
    fields: [fundAProject.createdById],
    references: [user.id],
  }),
  fundAProjectTags: many(fundAProjectTags),
}))

export const fundAProjectTagsRelations = relations(fundAProjectTags, ({ one }) => ({
  fundAProject: one(fundAProject, {
    fields: [fundAProjectTags.fundAProjectId],
    references: [fundAProject.id],
  }),
  tag: one(tags, {
    fields: [fundAProjectTags.tagId],
    references: [tags.id],
  }),
}))
