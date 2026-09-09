import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const HoldSchema = z.object({
  company_id: z.string().min(1),
  unit_id: z.string().min(1),
  lead_id: z.string().min(1),
  member_id: z.string().default('mem-arjun-04'),
  hold_amount: z.number().default(50000),
  duration_hours: z.number().default(48),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = HoldSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 });
    }

    const { company_id, unit_id, lead_id, member_id, hold_amount, duration_hours, notes } = parsed.data;

    const unit = db.holdUnit(company_id, unit_id, lead_id, member_id, hold_amount, duration_hours, notes);

    // Also log activity to lead
    try {
      db.addLeadActivity(company_id, {
        company_id,
        lead_id,
        actor_member_id: member_id,
        activity_type: 'task',
        title: `Unit ${unit.unit_number} Placed on Hold`,
        description: `48-Hour expiring hold placed for ₹${hold_amount.toLocaleString('en-IN')}. Expires at ${unit.hold_expires_at}.`,
      });
      db.updateLead(company_id, lead_id, {
        last_contacted_at: new Date().toISOString(),
      });
    } catch (e) {
      // Activity logging shouldn't block hold
    }

    return NextResponse.json({ success: true, unit });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to place hold on unit' }, { status: 400 });
  }
}
