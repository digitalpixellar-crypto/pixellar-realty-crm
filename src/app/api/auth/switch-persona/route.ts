import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { memberId, platformAdminId, redirectTo } = await req.json();

    const response = NextResponse.json({ success: true, redirectTo: redirectTo || '/' });

    if (memberId) {
      response.cookies.set('pixellar_active_member_id', memberId, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
      });
      response.cookies.delete('pixellar_platform_admin_id');
    } else if (platformAdminId) {
      response.cookies.set('pixellar_platform_admin_id', platformAdminId, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
      });
      response.cookies.delete('pixellar_active_member_id');
    }

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
