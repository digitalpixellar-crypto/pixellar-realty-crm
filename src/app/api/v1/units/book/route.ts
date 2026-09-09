import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const BookSchema = z.object({
  company_id: z.string().min(1),
  unit_id: z.string().min(1),
  customer_name: z.string().min(1),
  customer_phone: z.string().min(6),
  customer_email: z.string().email().optional(),
  sales_member_id: z.string().default('mem-arjun-04'),
  channel_partner_id: z.string().optional(),
  base_quoted_amount: z.number().positive(),
  discount_amount: z.number().default(0),
  booking_amount: z.number().positive(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = BookSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 });
    }

    const {
      company_id,
      unit_id,
      customer_name,
      customer_phone,
      customer_email,
      sales_member_id,
      channel_partner_id,
      base_quoted_amount,
      discount_amount,
      booking_amount,
      notes,
    } = parsed.data;

    // 1. Create or associate customer record
    const customer = db.createCustomer(company_id, {
      first_name: customer_name,
      phone: customer_phone,
      email: customer_email,
      kyc_status: 'pending',
    });

    // 2. Atomic booking lock
    const { booking, unit } = db.bookUnitAtomic(company_id, unit_id, {
      customerId: customer.id,
      salesMemberId: sales_member_id,
      channelPartnerId: channel_partner_id,
      baseQuotedAmount: base_quoted_amount,
      discountAmount: discount_amount,
      bookingAmount: booking_amount,
    });

    // 3. Record booking advance payment
    db.recordCustomerPayment(company_id, {
      booking_id: booking.id,
      customer_id: customer.id,
      amount: booking_amount,
      payment_mode: 'neft_rtgs',
      payment_date: new Date().toISOString().split('T')[0],
      recorded_by_member_id: sales_member_id,
      notes: notes || 'Booking advance token payment recorded.',
    });

    return NextResponse.json({
      success: true,
      booking,
      unit,
      customer,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to book unit' }, { status: 400 });
  }
}
