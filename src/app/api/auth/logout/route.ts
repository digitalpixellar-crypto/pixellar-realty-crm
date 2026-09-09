import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const res = NextResponse.json({ success: true, redirectUrl: '/login' });
  res.cookies.delete('pixellar_active_member_id');
  res.cookies.delete('pixellar_platform_admin_id');
  return res;
}

export async function GET(req: NextRequest) {
  const res = NextResponse.redirect(new URL('/login', req.url));
  res.cookies.delete('pixellar_active_member_id');
  res.cookies.delete('pixellar_platform_admin_id');
  return res;
}
