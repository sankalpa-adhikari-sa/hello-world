interface OrganizationInvitationEmailProps {
  email: string
  invitedByUsername: string
  invitedByEmail: string
  teamName: string
  inviteLink: string
}

export function OrganizationInvitationEmail({
  email,
  invitedByUsername,
  invitedByEmail,
  teamName,
  inviteLink,
}: OrganizationInvitationEmailProps) {
  const previewText = `Join ${teamName} on OpenAg`

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${previewText}</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif;
        background-color: #f8fafc;
        color: #0f172a;
        line-height: 1.6;
      }
      .email-container {
        max-width: 600px;
        margin: 0 auto;
        padding: 40px 20px;
      }
      .card {
        background: white;
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        padding: 40px;
      }
      .header {
        text-align: center;
        margin-bottom: 32px;
        padding-bottom: 24px;
        border-bottom: 1px solid #e2e8f0;
      }
      .logo {
        font-size: 28px;
        font-weight: 700;
        color: #10b981;
        margin-bottom: 8px;
      }
      .tagline {
        color: #64748b;
        font-size: 14px;
      }
      h1 {
        font-size: 24px;
        font-weight: 600;
        margin: 0 0 16px 0;
        color: #0f172a;
      }
      .greeting {
        font-size: 18px;
        margin-bottom: 24px;
      }
      .message {
        color: #475569;
        margin-bottom: 24px;
      }
      .invitation-details {
        background: #f1f5f9;
        padding: 20px;
        border-radius: 8px;
        margin: 24px 0;
      }
      .detail-row {
        display: flex;
        margin-bottom: 12px;
      }
      .detail-row:last-child {
        margin-bottom: 0;
      }
      .detail-label {
        font-weight: 600;
        min-width: 120px;
        color: #334155;
      }
      .detail-value {
        color: #475569;
      }
      .button-container {
        text-align: center;
        margin: 32px 0;
      }
      .button {
        display: inline-block;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        text-decoration: none;
        padding: 14px 32px;
        border-radius: 8px;
        font-weight: 600;
        font-size: 16px;
        box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);
        transition: all 0.2s ease;
      }
      .button:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 8px -1px rgba(16, 185, 129, 0.3);
      }
      .footer {
        margin-top: 32px;
        padding-top: 24px;
        border-top: 1px solid #e2e8f0;
        text-align: center;
        color: #64748b;
        font-size: 14px;
      }
      .footer-links {
        margin: 16px 0;
      }
      .footer-links a {
        color: #10b981;
        text-decoration: none;
        margin: 0 8px;
      }
      .footer-links a:hover {
        text-decoration: underline;
      }
      .security-note {
        background: #fef3c7;
        border-left: 4px solid #f59e0b;
        padding: 12px 16px;
        margin: 20px 0;
        font-size: 14px;
        border-radius: 4px;
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="card">
        <div class="header">
          <div class="logo">OpenAg</div>
          <div class="tagline">Agriculture Innovation Platform</div>
        </div>

        <h1>You're Invited to Join a Team!</h1>

        <p class="greeting">Hi there,</p>

        <p class="message">
          <strong>${invitedByUsername}</strong> (${invitedByEmail}) has invited you to join the
          <strong>${teamName}</strong> team on OpenAg. Collaborate on agricultural projects, share
          resources, and make an impact in the farming community.
        </p>

        <div class="invitation-details">
          <div class="detail-row">
            <div class="detail-label">Team Name:</div>
            <div class="detail-value">${teamName}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Invited By:</div>
            <div class="detail-value">${invitedByUsername}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Email:</div>
            <div class="detail-value">${email}</div>
          </div>
        </div>

        <div class="button-container">
          <a href="${inviteLink}" class="button">Accept Invitation</a>
        </div>

        <div class="security-note">
          <strong>🔒 Security Notice:</strong> This invitation link will expire in 7 days. If you
          didn't expect this invitation, you can safely ignore this email.
        </div>

        <div class="footer">
          <p>You're receiving this email because you were invited to join ${teamName} on OpenAg.</p>
          <div class="footer-links">
            <a href="${process.env.BETTER_AUTH_URL || 'http://localhost:3000'}">Learn More</a>
            •
            <a href="${process.env.BETTER_AUTH_URL || 'http://localhost:3000'}/support">Contact Support</a>
          </div>
          <p>© 2026 OpenAg. All rights reserved.</p>
        </div>
      </div>
    </div>
  </body>
</html>
  `.trim()
}

/**
 * Get the plain text version of the invitation email
 */
export function OrganizationInvitationEmailText({
  email,
  invitedByUsername,
  invitedByEmail,
  teamName,
  inviteLink,
}: OrganizationInvitationEmailProps): string {
  return `
You're Invited to Join ${teamName} on OpenAg

Hi there,

${invitedByUsername} (${invitedByEmail}) has invited you to join the ${teamName} team on OpenAg.

Team Details:
  Team Name: ${teamName}
  Invited By: ${invitedByUsername}
  Email: ${email}

To accept this invitation, click the link below:

${inviteLink}

Security Notice:
- This invitation link will expire in 7 days
- If you didn't expect this invitation, you can safely ignore this email

---
You're receiving this email because you were invited to join ${teamName} on OpenAg.
© 2026 OpenAg. All rights reserved.
  `.trim()
}
