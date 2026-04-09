import { z } from 'zod'

const baseUserProfileSchema = z.object({
  displayName: z.string().nullish(),
  bio: z.string().nullish(),
  headline: z.string().nullish(),
  websiteUrl: z.string().nullish(),
  location: z.string().nullish(),
  isStudent: z.boolean().default(false),
  studentMajor: z.string().nullish(),
  studentGraduationYear: z.int().nullish(),
})

export const userProfileInputSchema = baseUserProfileSchema

export const userProfileOutputSchema = baseUserProfileSchema.extend({
  id: z.uuid(),
  userId: z.uuid(),
  createdAt: z.date(),
  isOnboardingCompleted: z.boolean(),
  updatedAt: z.date().nullish(),
  createdById: z.uuid(),
})

export const userProfileMinimalSchema = z.object({
  name: z.string(),
  email: z.email(),
  image: z.string().nullish(),
  displayName: z.string().nullish(),
  isStudent: z.boolean().nullish().default(false),
  studentMajor: z.string().nullish(),
  studentGraduationYear: z.int().nullish(),
})

export type UserProfileInput = z.infer<typeof userProfileInputSchema>
export type UserProfileOutput = z.infer<typeof userProfileOutputSchema>
export type UserProfileMinimal = z.infer<typeof userProfileMinimalSchema>
