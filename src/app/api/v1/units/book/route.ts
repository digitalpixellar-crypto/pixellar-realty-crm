import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const BookSchema = z.object({
  company_id: z.string().min(1),
  unit_id: z.string().min(1),
  customer_id: z.string().optional(),
  customer_name: z.string().optional(),
  customer_phone: z.string().optional(),
  customer_email: z.string().email().optional(),
  sales_member_id: z.string().default('mem-arjun-04'),
  channel_partner_id: z.string().optional(),
  base_quoted_amount: z.number().positive().optional(),
  net_sale_amount: z.number().positive().optional(),
  discount_amount: z.number().default(0),
  booking_amount: z.number().positive().optional(),
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
      customer_id,
      customer_name,
      customer_phone,
      customer_email,
      sales_member_id,
      channel_partner_id,
      base_quoted_amount,
      net_sale_amount,
      discount_amount,
      booking_amount,
      notes,
    } = parsed.data;

    // 1. Resolve or create customer record
    let customer = customer_id ? db.getCustomers(company_id).find((c) => c.id === customer_id) || null : null;
    if (!customer) {
      customer = db.createCustomer(company_id, {
        first_name: customer_name || 'Valued Buyer',
        phone: customer_phone || '+919876543210',
        email: customer_email,
        kyc_status: 'pending',
      });
    }

    const finalQuoted = base_quoted_amount || net_sale_amount || 5000000;
    const finalBookingAmt = booking_amount || 50000;

    // 2. Atomic booking lock
    const { booking, unit } = db.bookUnitAtomic(company_id, unit_id, {
      customerId: customer.id,
      salesMemberId: sales_member_id,
      channelPartnerId: channel_partner_id,
      baseQuotedAmount: finalQuoted,
      discountAmount: discount_amount,
      bookingAmount: finalBookingAmt,
    });

    // 3. Record booking advance payment
    db.recordCustomerPayment(company_id, {
      booking_id: booking.id,
      customer_id: customer.id,
      amount: finalBookingAmt,
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
