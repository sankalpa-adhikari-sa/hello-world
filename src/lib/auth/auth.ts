import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { lastLoginMethod, organization } from 'better-auth/plugins'
import { ac, admin, member, owner } from '@/lib/auth/permissions'
import { db } from '@/db'
import { organizationProfile } from '@/db/schema/organization.schema'
import { userProfile } from '@/db/schema/auth.schema'
import { sendOrganizationInvitationEmail } from '@/emails/send-email'

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await db.insert(userProfile).values({
            userId: user.id,
          })
        },
      },
    },
  },
  plugins: [
    organization({
      ac,
      roles: {
        owner,
        admin,
        member,
      },
      requireEmailVerificationOnInvitation: true,
      async sendInvitationEmail(data) {
        const baseURL = process.env.BETTER_AUTH_URL || 'http://localhost:3000'
        const inviteLink = `${baseURL}/orgs/accept-invitation/${data.id}`
        await sendOrganizationInvitationEmail({
          email: data.email,
          invitedByUsername: data.inviter.user.name,
          invitedByEmail: data.inviter.user.email,
          teamName: data.organization.name,
          inviteLink,
        })
      },
      organizationHooks: {
        afterCreateOrganization: async ({ organization }) => {
          await db.insert(organizationProfile).values({
            organizationId: organization.id,
            content: {},
          })
        },
      },
    }),
    lastLoginMethod(),
    tanstackStartCookies(),
  ],
  advanced: {
    database: {
      generateId: false,
    },
  },
})
