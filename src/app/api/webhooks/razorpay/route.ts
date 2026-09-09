import { NextRequest, NextResponse } from 'next/server';
import { processRazorpayWebhook } from '@/lib/billing/razorpay';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature') || '';

    if (!signature) {
      return NextResponse.json({ error: 'Missing x-razorpay-signature header' }, { status: 400 });
    }

    const result = await processRazorpayWebhook(rawBody, signature);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      received: true,
      message: result.message,
      duplicate: result.duplicate,
    });
  } catch (err: any) {
    console.error('Razorpay webhook endpoint error:', err);
    return NextResponse.json({ error: err.message || 'Internal webhook error' }, { status: 500 });
  }
}
