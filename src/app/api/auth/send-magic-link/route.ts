import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendEmail, generateMagicLinkHtml } from '@/lib/mail/resend';
import { z } from 'zod';

const MagicLinkSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = MagicLinkSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const email = parsed.data.email.trim().toLowerCase();

    // Verify account exists or is platform owner
    const platformAdmins = db.getPlatformAdmins();
    const isOwner = email === 'digitalpixellar@gmail.com' || platformAdmins.some((a) => a.email.toLowerCase() === email);

    let isMember = false;
    let targetCompanySlug = '';
    const allCompanies = db.getCompanies();
    for (const company of allCompanies) {
      const members = db.getCompanyMembers(company.id);
      if (members.some((m) => m.email.toLowerCase() === email && m.is_active)) {
        isMember = true;
        targetCompanySlug = company.slug;
        break;
      }
    }

    if (!isOwner && !isMember) {
      return NextResponse.json(
        {
          error: `No registered account found for ${email}. Please check your spelling or contact your administrator.`,
        },
        { status: 404 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.pixellarealty.com';
    const loginToken = `magic_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const destination = isOwner ? '/platform/dashboard' : `/app/${targetCompanySlug}/dashboard`;
    const magicLoginUrl = `${appUrl}/login?auto_login=true&email=${encodeURIComponent(email)}&token=${loginToken}&dest=${encodeURIComponent(destination)}`;

    // Dispatch email via Resend
    const emailResult = await sendEmail({
      to: email,
      subject: 'Your Sign-In Link to PIXELLAR REALTY CRM',
      html: generateMagicLinkHtml(email, magicLoginUrl, 15),
      text: `Sign in to Pixellar Realty CRM by visiting: ${magicLoginUrl}`,
    });

    return NextResponse.json({
      success: true,
      email,
      messageId: emailResult.messageId,
      simulated: emailResult.simulated,
      resendError: emailResult.error,
      directLoginUrl: magicLoginUrl,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to send login link' }, { status: 500 });
  }
}
