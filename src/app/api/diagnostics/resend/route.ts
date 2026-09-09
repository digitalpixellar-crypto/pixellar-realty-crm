import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'PIXELLAR REALTY CRM <onboarding@resend.dev>';

  if (!apiKey) {
    return NextResponse.json({
      configured: false,
      error: 'RESEND_API_KEY environment variable is not defined in Vercel.',
      fromEmail,
      help: 'Add RESEND_API_KEY into Vercel Project Settings -> Environment Variables.',
    });
  }

  const maskedKey = apiKey.startsWith('re_')
    ? `${apiKey.substring(0, 6)}...${apiKey.substring(apiKey.length - 4)} (length: ${apiKey.length})`
    : 'INVALID_FORMAT (does not start with re_)';

  // 1. Check registered domains in Resend
  let domainsData: any = null;
  let domainsError: string | null = null;
  try {
    const res = await fetch('https://api.resend.com/domains', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      domainsError = data.message || data.error || `HTTP ${res.status}`;
    } else {
      domainsData = data;
    }
  } catch (e: any) {
    domainsError = e.message;
  }

  // 2. Test send to digitalpixellar@gmail.com
  let testSendResult: any = null;
  try {
    const sendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: ['digitalpixellar@gmail.com'],
        subject: 'Resend Diagnostic Test - Pixellar Realty CRM',
        text: 'This is a diagnostic test to verify your Resend email setup on pixellarrealty.com.',
      }),
    });
    const sendData = await sendRes.json().catch(() => ({}));
    testSendResult = {
      status: sendRes.status,
      ok: sendRes.ok,
      data: sendData,
    };
  } catch (e: any) {
    testSendResult = {
      status: 500,
      ok: false,
      error: e.message,
    };
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    configured: true,
    maskedKey,
    fromEmail,
    domainsData,
    domainsError,
    testSendResult,
  });
}
