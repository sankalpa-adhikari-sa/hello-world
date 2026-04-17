import { Resend } from 'resend'
import { OrganizationInvitationEmail } from '@/emails/organization-invitation'

/**
 * Organization Invitation Email using resend
 */
export async function sendOrganizationInvitationEmail(data: {
  email: string
  invitedByUsername: string
  invitedByEmail: string
  teamName: string
  inviteLink: string
}) {
  const resend = new Resend(process.env.RESEND_API_KEY)

  const htmlEmail = OrganizationInvitationEmail({
    email: data.email,
    invitedByUsername: data.invitedByUsername,
    invitedByEmail: data.invitedByEmail,
    teamName: data.teamName,
    inviteLink: data.inviteLink,
  })

  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'OpenAg <onboarding@resend.dev>',
      to: data.email,
      subject: `You're invited to join ${data.teamName} on OpenAg`,
      html: htmlEmail,
      replyTo: data.invitedByEmail,
    })

    return { success: true, data: result }
  } catch (error) {
    console.error('Failed to send organization invitation email:', error)
    throw new Error('Failed to send invitation email')
  }
}
