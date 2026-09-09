import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendEmail, generateInvitationHtml } from '@/lib/mail/resend';
import { ROLE_LABELS } from '@/lib/auth/permissions';
import { z } from 'zod';

const ResendInviteSchema = z.object({
  company_id: z.string().min(1),
  invitation_id: z.string().optional(),
  email: z.string().email().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ResendInviteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid invitation resend payload' }, { status: 400 });
    }

    const { company_id, invitation_id, email } = parsed.data;
    const company = db.getCompany(company_id);
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Refresh invitation or create new token
    let invitation;
    if (invitation_id) {
      invitation = db.getInvitationByToken(invitation_id);
    }

    const targetEmail = email || invitation?.email;
    if (!targetEmail) {
      return NextResponse.json({ error: 'Target email not specified' }, { status: 400 });
    }

    const role = invitation?.role || 'sales_executive';
    const newInvitation = db.createInvitation(company.id, 'mem-vikram-01', targetEmail, role);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.pixellarrealty.com';
    const inviteUrl = `${appUrl}/invite/accept?token=${newInvitation.token}`;
    const roleLabel = ROLE_LABELS[role as keyof typeof ROLE_LABELS] || role;

    // Dispatch invitation email via Resend
    const emailResult = await sendEmail({
      to: targetEmail,
      subject: `You've been invited to join ${company.name} on Pixellar Realty CRM`,
      html: generateInvitationHtml(targetEmail, company.name, roleLabel, 'Company Owner', inviteUrl),
      text: `Join ${company.name} on Pixellar Realty CRM: ${inviteUrl}`,
    });

    return NextResponse.json({
      success: true,
      email: targetEmail,
      inviteUrl,
      invitation: newInvitation,
      simulated: emailResult.simulated,
      messageId: emailResult.messageId,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to resend invitation email' }, { status: 500 });
  }
}
