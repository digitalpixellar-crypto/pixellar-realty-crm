// ============================================================================
// PIXELLAR REALTY CRM - TRANSACTIONAL EMAIL & RESEND SERVICE
// Product Owner: K. Yeswanth Kumar Reddy (digitalpixellar@gmail.com)
// ============================================================================

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  simulated: boolean;
  error?: string;
}

const RESEND_API_URL = 'https://api.resend.com/emails';
const DEFAULT_FROM = process.env.RESEND_FROM_EMAIL || 'PIXELLAR REALTY CRM <onboarding@resend.dev>';

export async function sendEmail({
  to,
  subject,
  html,
  text,
  from = DEFAULT_FROM,
}: SendEmailOptions): Promise<EmailResult> {
  const recipients = Array.isArray(to) ? to : [to];
  const apiKey = process.env.RESEND_API_KEY;

  // If live Resend API key is provided, send through Resend API
  if (apiKey && apiKey.startsWith('re_')) {
    try {
      const res = await fetch(RESEND_API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: recipients,
          subject,
          html,
          text: text || subject,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to dispatch email via Resend');
      }

      return {
        success: true,
        messageId: data.id,
        simulated: false,
      };
    } catch (err: any) {
      console.error('[Resend API Error]:', err);
      // Fallback to simulated mode so users are never blocked
      return {
        success: true,
        messageId: `sim_fallback_${Date.now()}`,
        simulated: true,
        error: err.message,
      };
    }
  }

  // Fallback simulated delivery for staging/demo environments
  console.log(`[PIXELLAR EMAIL DISPATCHED] To: ${recipients.join(', ')} | Subject: ${subject}`);
  return {
    success: true,
    messageId: `sim_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    simulated: true,
  };
}

// ----------------------------------------------------------------------------
// Email Template: Magic Login Link
// ----------------------------------------------------------------------------
export function generateMagicLinkHtml(recipientEmail: string, loginUrl: string, expiresMinutes = 15): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 40px 20px; }
          .card { max-width: 520px; margin: 0 auto; background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 36px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
          .brand { font-size: 18px; font-weight: 800; color: #38bdf8; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px; }
          .title { font-size: 24px; font-weight: 800; color: #ffffff; margin: 12px 0; }
          .desc { font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 24px; }
          .btn { display: inline-block; background: #0284c7; color: #ffffff !important; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 10px; text-decoration: none; margin: 8px 0 24px 0; box-shadow: 0 4px 14px rgba(2, 132, 199, 0.4); }
          .footer { font-size: 11px; color: #64748b; border-top: 1px solid #334155; padding-top: 18px; margin-top: 24px; }
          .url-box { background: #0f172a; padding: 10px; border-radius: 6px; font-family: monospace; font-size: 11px; color: #cbd5e1; word-break: break-all; margin-top: 12px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="brand">PIXELLAR REALTY CRM</div>
          <h1 class="title">Secure Sign-In Link</h1>
          <p class="desc">
            Hello, we received a sign-in request for <strong>${recipientEmail}</strong>. Click the button below to instantly access your Pixellar Realty CRM dashboard.
          </p>
          <div style="text-align: center;">
            <a href="${loginUrl}" class="btn">Sign In to Workspace →</a>
          </div>
          <p class="desc" style="font-size: 12px; color: #94a3b8; text-align: center;">
            ⏱️ This login link will expire in <strong>${expiresMinutes} minutes</strong> and can only be used once.
          </p>
          <div class="footer">
            If you did not request this email, you can safely ignore it.
            <div class="url-box">${loginUrl}</div>
          </div>
        </div>
      </body>
    </html>
  `;
}

// ----------------------------------------------------------------------------
// Email Template: Team Member Invitation
// ----------------------------------------------------------------------------
export function generateInvitationHtml(
  recipientEmail: string,
  companyName: string,
  roleName: string,
  inviterName: string,
  inviteUrl: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 40px 20px; }
          .card { max-width: 540px; margin: 0 auto; background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 36px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
          .brand { font-size: 16px; font-weight: 800; color: #38bdf8; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px; }
          .title { font-size: 22px; font-weight: 800; color: #ffffff; margin: 12px 0; }
          .desc { font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 20px; }
          .info-box { background: #0f172a; border: 1px solid #334155; border-radius: 10px; padding: 16px; margin-bottom: 24px; font-size: 13px; }
          .info-row { display: flex; justify-content: space-between; padding: 4px 0; }
          .btn { display: inline-block; background: #10b981; color: #ffffff !important; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 10px; text-decoration: none; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4); }
          .footer { font-size: 11px; color: #64748b; border-top: 1px solid #334155; padding-top: 18px; margin-top: 24px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="brand">PIXELLAR REALTY CRM</div>
          <h1 class="title">You've Been Invited to Join ${companyName}</h1>
          <p class="desc">
            <strong>${inviterName}</strong> has invited you to join their real estate sales workspace on Pixellar Realty CRM.
          </p>
          <div class="info-box">
            <div style="color: #cbd5e1; margin-bottom: 6px;"><strong>Workspace:</strong> ${companyName}</div>
            <div style="color: #cbd5e1; margin-bottom: 6px;"><strong>Role:</strong> <span style="color: #38bdf8;">${roleName}</span></div>
            <div style="color: #cbd5e1;"><strong>Assigned Email:</strong> ${recipientEmail}</div>
          </div>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${inviteUrl}" class="btn">Accept Invitation & Get Started →</a>
          </div>
          <p class="desc" style="font-size: 12px; text-align: center;">
            This invitation link is valid for <strong>7 days</strong>.
          </p>
          <div class="footer">
            If you were not expecting this invitation, you can ignore this email.
          </div>
        </div>
      </body>
    </html>
  `;
}
