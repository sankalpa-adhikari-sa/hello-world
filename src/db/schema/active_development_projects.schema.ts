import { relations } from 'drizzle-orm'
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { user } from './auth.schema'

export const activeDevelopmentProject = pgTable('active_development_project', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  name: text('name').notNull(),
  projectStartDate: timestamp('start_date', {
    mode: 'date',
    withTimezone: true,
  }),
  projectEndDate: timestamp('end_date', { mode: 'date', withTimezone: true }),
  budget: integer('budget'),
  isFeatured: boolean().default(false),
  content: jsonb('content').$type<Record<string, any>>().notNull(),
  isArchived: boolean(),
  archivedAt: timestamp('archived_at', { mode: 'date', withTimezone: true }),
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

export const developmentProjectLocation = pgTable(
  'development_project_location',
  {
    id: uuid('id').defaultRandom().primaryKey().notNull(),
    country: text('country').notNull(),
    state: text('state').notNull(),
    province: text('province').notNull(),
    city: text('city'),
    addressLine1: text('address_line_1'),
    addressLine2: text('address_line_2'),
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
  },
)

export const activeDevelopmentProjectRelations = relations(
  activeDevelopmentProject,
  ({ one }) => ({
    createdBy: one(user, {
      fields: [activeDevelopmentProject.createdById],
      references: [user.id],
    }),
  }),
)

export const developmentProjectLocationRelations = relations(
  developmentProjectLocation,
  ({ one }) => ({
    createdBy: one(user, {
      fields: [developmentProjectLocation.createdById],
      references: [user.id],
    }),
  }),
)
