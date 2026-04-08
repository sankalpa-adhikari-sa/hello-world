import { z } from 'zod'
import {
  COMPANY_SIZE,
  INDUSTRY_TYPE,
  JOB_STATUS,
  ORGANIZATION_TYPE,
  PROJECT_STATUS,
  RESOURCE_SOURCE,
} from '@/constants/enums'

const projectStatusEnum = z.enum(
  PROJECT_STATUS.map((group) => group.value) as [string, ...Array<string>],
)
const resourceSourceEnum = z.enum(
  RESOURCE_SOURCE.map((group) => group.value) as [string, ...Array<string>],
)
const organizationTypeEnum = z.enum(
  ORGANIZATION_TYPE.map((group) => group.value) as [string, ...Array<string>],
)
const industryTypeEnum = z.enum(
  INDUSTRY_TYPE.map((group) => group.value) as [string, ...Array<string>],
)
const jobStatusEnum = z.enum(
  JOB_STATUS.map((group) => group.value) as [string, ...Array<string>],
)
const companySizeEnum = z.enum(
  COMPANY_SIZE.map((group) => group.value) as [string, ...Array<string>],
)

/** Optional string inputs that may be empty before submit. */
const emptyOrUrl = z.union([z.literal(''), z.url()])
const emptyOrEmail = z.union([z.literal(''), z.email()])

export const organizationFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters'),
})

export type OrganizationFormValues = z.infer<typeof organizationFormSchema>

export const organizationProfileFormSchema = z.object({
  subtitle: z.string().nullish(),
  content: z.any(),
  website: emptyOrUrl.nullish(),
  location: z.string().nullish(),
  industry: industryTypeEnum,
  organizationType: organizationTypeEnum,
  companySize: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : v),
    companySizeEnum.optional(),
  ),
  foundedYear: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : v),
    z.coerce.number().int().min(1800).max(2100).optional(),
  ),
  contactEmail: emptyOrEmail.nullish(),
  linkedinUrl: emptyOrUrl.nullish(),
  twitterUrl: emptyOrUrl.nullish(),
})

export type OrganizationProfileFormValues = z.infer<
  typeof organizationProfileFormSchema
>

export const organizationProjectFormSchema = z.object({
  website: emptyOrUrl.nullish(),
  location: z.string().nullish(),
  subtitle: z.string().nullish(),
  content: z.any(),
  projectStatus: projectStatusEnum,
})

export type OrganizationProjectFormValues = z.infer<
  typeof organizationProjectFormSchema
>

export const jobFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().min(1, 'Subtitle is required'),
  location: z.string().nullish(),
  type: z.string().min(1, 'Job type is required'),
  applicationLink: emptyOrUrl.nullish(),
  salaryRange: z.string().nullish(),
  status: jobStatusEnum,
  content: z.any(),
})

export type JobFormValues = z.infer<typeof jobFormSchema>

export const organizationEventFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().nullish(),
  eventType: z.string().min(1, 'Event type is required'),
  startDate: z.coerce.date(),
  endDate: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : v),
    z.coerce.date().optional(),
  ),
  location: z.string().nullish(),
  meetingLink: emptyOrUrl.nullish(),
  isPublic: z.boolean(),
  isFeatured: z.boolean(),
  content: z.any(),
})

export type OrganizationEventFormValues = z.infer<
  typeof organizationEventFormSchema
>

export const resourceFormSchema = z.object({
  projectId: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : v),
    z.uuid().optional(),
  ),
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().nullish(),
  content: z.any(),
  resourceType: z.string().min(1, 'Resource type is required'),
  url: z.url(),
  isOfficial: z.boolean(),
  isVerified: z.boolean(),
  source: resourceSourceEnum,
})

export type ResourceFormValues = z.infer<typeof resourceFormSchema>
