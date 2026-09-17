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
  const domainDetails: Record<string, any> = {};

  try {
    const res = await fetch('https://api.resend.com/domains', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      domainsError = data.message || data.error || `HTTP ${res.status}`;
    } else {
      domainsData = data;
      // Trigger verify and fetch detailed record statuses
      if (Array.isArray(data.data)) {
        for (const d of data.data) {
          try {
            await fetch(`https://api.resend.com/domains/${d.id}/verify`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${apiKey}` },
            });
            const detailRes = await fetch(`https://api.resend.com/domains/${d.id}`, {
              headers: { Authorization: `Bearer ${apiKey}` },
            });
            const detailData = await detailRes.json().catch(() => ({}));
            domainDetails[d.name] = {
              id: d.id,
              status: detailData.status,
              records: detailData.records,
            };
          } catch (err: any) {
            domainDetails[d.name] = { error: err.message };
          }
        }
      }
    }
  // 1b. Check if pixellarrealty.com exists in Resend, if not create it
  let createPixellarRealtyResult: any = null;
  const hasPixellarRealty = domainsData?.data?.some((d: any) => d.name === 'pixellarrealty.com');
  if (!hasPixellarRealty && apiKey) {
    try {
      const createRes = await fetch('https://api.resend.com/domains', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'pixellarrealty.com',
          region: 'ap-northeast-1',
        }),
      });
      createPixellarRealtyResult = await createRes.json().catch(() => ({}));
      if (createPixellarRealtyResult?.id) {
        await fetch(`https://api.resend.com/domains/${createPixellarRealtyResult.id}/verify`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}` },
        });
      }
    } catch (e: any) {
      createPixellarRealtyResult = { error: e.message };
    }
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
        text: 'This is a diagnostic test to verify your Resend email setup on pixellarealty.com.',
      }),
    });
    const sendData = await sendRes.json().catch(() => ({}));
    testSendResult = {
      from: fromEmail,
      status: sendRes.status,
      ok: sendRes.ok,
      data: sendData,
    };
  } catch (e: any) {
    testSendResult = {
      from: fromEmail,
      status: 500,
      ok: false,
      error: e.message,
    };
  }

  // 3. Test sending from verified domain mail.digitalpixellar.com
  let testVerifiedDomainResult: any = null;
  try {
    const verifiedSendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'PIXELLAR REALTY CRM <auth@mail.digitalpixellar.com>',
        to: ['digitalpixellar@gmail.com'],
        subject: 'Verified Subdomain Delivery Test - Pixellar Realty CRM',
        text: 'This email was delivered via verified domain mail.digitalpixellar.com to confirm instant inbox delivery.',
      }),
    });
    const verifiedData = await verifiedSendRes.json().catch(() => ({}));
    testVerifiedDomainResult = {
      from: 'PIXELLAR REALTY CRM <auth@mail.digitalpixellar.com>',
      status: verifiedSendRes.status,
      ok: verifiedSendRes.ok,
      data: verifiedData,
    };
  } catch (e: any) {
    testVerifiedDomainResult = {
      from: 'PIXELLAR REALTY CRM <auth@mail.digitalpixellar.com>',
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
    domainDetails,
    createPixellarRealtyResult,
    domainsError,
    testSendResult,
    testVerifiedDomainResult,
  });
}
