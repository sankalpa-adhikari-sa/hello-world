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
import { organization, user } from './auth.schema'
import { tags } from './tags.schema'

export const projectStatusEnum = pgEnum('project_status', [
  'ongoing',
  'completed',
  'paused',
])

export const resourceSourceEnum = pgEnum('resource_source', [
  'user_submission',
  'organization',
  'partner',
])

export const organizationTypeEnum = pgEnum('organization_type', [
  'government',
  'ngo_ingo',
  'private',
  'public',
  'community',
])
export const industryTypeEnum = pgEnum('industry_type', [
  'agriculture',
  'healthcare',
])

export const jobStatusEnum = pgEnum('job_status', ['active', 'closed', 'draft'])
export const companySizeEnum = pgEnum('company_size', [
  '1-10',
  '11-50',
  '51-200',
  '201-500',
  '500+',
])
export const organizationProfile = pgTable('organization_profile', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  organizationId: uuid('organization_id')
    .notNull()
    .unique()
    .references(() => organization.id, { onDelete: 'cascade' }),
  subtitle: text('subtitle'),
  content: jsonb('content').$type<Record<string, any>>().notNull(),
  website: text('website').unique(),
  location: text('location'),
  industry: industryTypeEnum('industry').default('agriculture'),
  organizationType:
    organizationTypeEnum('organization_type').default('ngo_ingo'),
  companySize: companySizeEnum('company_size'),
  foundedYear: integer('founded_year'),
  contactEmail: text('contact_email'),
  linkedinUrl: text('linkedin_url'),
  twitterUrl: text('twitter_url'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export const organizationProjects = pgTable('organization_projects', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  website: text('website'),
  location: text('location'),
  subtitle: text('subtitle'),
  content: jsonb('content').$type<Record<string, any>>().notNull(),
  projectStatus: projectStatusEnum('project_status')
    .default('ongoing')
    .notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export const jobs = pgTable('jobs', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  organizationId: uuid('organizationId')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  subtitle: text('subtitle').notNull(),
  location: text('location'),
  type: text('type').notNull(),
  applicationLink: text('application_link'),
  salaryRange: text('salary_range'),
  status: jobStatusEnum('status').default('active').notNull(),
  content: jsonb('content').$type<Record<string, any>>().notNull(),
  createdById: uuid('created_by_id')
    .notNull()
    .references(() => user.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const events = pgTable('events', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  organizationId: uuid('organizationId')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  eventType: text('event_type').notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  location: text('location'),
  meetingLink: text('meeting_link'),
  isPublic: boolean('is_public').default(true),
  isFeatured: boolean().default(false),
  content: jsonb('content').$type<Record<string, any>>().notNull(),
  createdById: uuid('created_by_id')
    .notNull()
    .references(() => user.id),
  createdAt: timestamp('created_at').defaultNow(),
})

export const resources = pgTable('resources', {
  id: uuid('id').defaultRandom().primaryKey().notNull(),
  organizationId: uuid('organizationId')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id').references(() => organizationProjects.id, {
    onDelete: 'set null',
  }),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  content: jsonb('content').$type<Record<string, any>>().notNull(),
  resourceType: text('resource_type').notNull(),
  url: text('url').notNull(),
  createdById: uuid('created_by_id')
    .notNull()
    .references(() => user.id),
  isOfficial: boolean('is_official').default(true).notNull(),
  isVerified: boolean('is_verified').default(false).notNull(),
  source: resourceSourceEnum('source').default('user_submission').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

export const organizationProjectTags = pgTable(
  'organization_project_tags',
  {
    organizationProjectId: uuid('organization_project_id')
      .notNull()
      .references(() => organizationProjects.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.organizationProjectId, t.tagId] })],
)

export const jobTags = pgTable(
  'job_tags',
  {
    jobId: uuid('job_id')
      .notNull()
      .references(() => jobs.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.jobId, t.tagId] })],
)

/** Org calendar `events` (not `content_events`). */
export const organizationEventTags = pgTable(
  'organization_event_tags',
  {
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.eventId, t.tagId] })],
)

export const resourceTags = pgTable(
  'resource_tags',
  {
    resourceId: uuid('resource_id')
      .notNull()
      .references(() => resources.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.resourceId, t.tagId] })],
)

export const resourcesRelations = relations(resources, ({ one, many }) => ({
  organization: one(organization, {
    fields: [resources.organizationId],
    references: [organization.id],
  }),
  project: one(organizationProjects, {
    fields: [resources.projectId],
    references: [organizationProjects.id],
  }),
  createdBy: one(user, {
    fields: [resources.createdById],
    references: [user.id],
  }),
  resourceTags: many(resourceTags),
}))

export const resourceTagsRelations = relations(resourceTags, ({ one }) => ({
  resource: one(resources, {
    fields: [resourceTags.resourceId],
    references: [resources.id],
  }),
  tag: one(tags, {
    fields: [resourceTags.tagId],
    references: [tags.id],
  }),
}))

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  organization: one(organization, {
    fields: [jobs.organizationId],
    references: [organization.id],
  }),
  createdBy: one(user, {
    fields: [jobs.createdById],
    references: [user.id],
  }),
  jobTags: many(jobTags),
}))

export const jobTagsRelations = relations(jobTags, ({ one }) => ({
  job: one(jobs, {
    fields: [jobTags.jobId],
    references: [jobs.id],
  }),
  tag: one(tags, {
    fields: [jobTags.tagId],
    references: [tags.id],
  }),
}))

export const eventsRelations = relations(events, ({ one, many }) => ({
  organization: one(organization, {
    fields: [events.organizationId],
    references: [organization.id],
  }),
  createdBy: one(user, {
    fields: [events.createdById],
    references: [user.id],
  }),
  organizationEventTags: many(organizationEventTags),
}))

export const organizationEventTagsRelations = relations(
  organizationEventTags,
  ({ one }) => ({
    event: one(events, {
      fields: [organizationEventTags.eventId],
      references: [events.id],
    }),
    tag: one(tags, {
      fields: [organizationEventTags.tagId],
      references: [tags.id],
    }),
  }),
)

export const organizationProfileRelations = relations(
  organizationProfile,
  ({ one }) => ({
    organization: one(organization, {
      fields: [organizationProfile.organizationId],
      references: [organization.id],
    }),
  }),
)

export const organizationProjectsRelations = relations(
  organizationProjects,
  ({ one, many }) => ({
    organization: one(organization, {
      fields: [organizationProjects.organizationId],
      references: [organization.id],
    }),
    resources: many(resources),
    organizationProjectTags: many(organizationProjectTags),
  }),
)

export const organizationProjectTagsRelations = relations(
  organizationProjectTags,
  ({ one }) => ({
    organizationProject: one(organizationProjects, {
      fields: [organizationProjectTags.organizationProjectId],
      references: [organizationProjects.id],
    }),
    tag: one(tags, {
      fields: [organizationProjectTags.tagId],
      references: [tags.id],
    }),
  }),
)
