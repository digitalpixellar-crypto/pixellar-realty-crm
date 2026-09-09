import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
    }

    const email = parsed.data.email.trim().toLowerCase();

    // 1. Check if Platform Superadmin
    const platformAdmins = db.getPlatformAdmins();
    const adminMatch = platformAdmins.find((a) => a.email.toLowerCase() === email);

    if (adminMatch || email === 'digitalpixellar@gmail.com' || email === 'owner@digitalpixellar.com') {
      const admin = adminMatch || platformAdmins[0];
      const res = NextResponse.json({
        success: true,
        redirectUrl: '/platform/dashboard',
        user: {
          id: admin.id,
          name: admin.full_name,
          email: admin.email,
          role: 'Platform Superadmin',
        },
      });

      res.cookies.set('pixellar_platform_admin_id', admin.id, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
      });
      res.cookies.delete('pixellar_active_member_id');
      return res;
    }

    // 2. Check if Tenant Member
    const allCompanies = db.getCompanies();
    for (const company of allCompanies) {
      const members = db.getCompanyMembers(company.id);
      const memberMatch = members.find((m) => m.email.toLowerCase() === email && m.is_active);

      if (memberMatch) {
        const res = NextResponse.json({
          success: true,
          redirectUrl: `/app/${company.slug}/dashboard`,
          user: {
            id: memberMatch.id,
            name: memberMatch.name,
            email: memberMatch.email,
            role: memberMatch.role,
            companyName: company.name,
          },
        });

        res.cookies.set('pixellar_active_member_id', memberMatch.id, {
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7,
        });
        res.cookies.delete('pixellar_platform_admin_id');
        return res;
      }
    }

    // 3. Unknown email
    return NextResponse.json(
      {
        error: `No registered account found for ${email}. Please verify your email or request an invitation from your company administrator.`,
      },
      { status: 401 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Login failed' }, { status: 500 });
  }
}
