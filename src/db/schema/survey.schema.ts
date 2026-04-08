import { relations } from 'drizzle-orm'
import {
  boolean,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { user } from './auth.schema'
import { tags } from './tags.schema'

export const survey = pgTable('survey', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  isFeatured: boolean().default(false),
  content: jsonb('content').$type<Record<string, any>>().notNull(),
  surveyLink: text('survey_link'),
  surveyDeadline: timestamp('survey_deadline', {
    mode: 'date',
    withTimezone: true,
  }).notNull(),
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

export const surveyTags = pgTable(
  'survey_tags',
  {
    surveyId: uuid('survey_id')
      .notNull()
      .references(() => survey.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.surveyId, t.tagId] })],
)

export const surveyRelations = relations(survey, ({ one, many }) => ({
  createdBy: one(user, {
    fields: [survey.createdById],
    references: [user.id],
  }),
  surveyTags: many(surveyTags),
}))

export const surveyTagsRelations = relations(surveyTags, ({ one }) => ({
  survey: one(survey, {
    fields: [surveyTags.surveyId],
    references: [survey.id],
  }),
  tag: one(tags, {
    fields: [surveyTags.tagId],
    references: [tags.id],
  }),
}))
