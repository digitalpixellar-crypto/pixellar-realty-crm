import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

import { ActivityType } from '@/types';

const ActivitySchema = z.object({
  company_id: z.string().min(1),
  lead_id: z.string().min(1),
  actor_name: z.string().default('Sales Agent'),
  activity_type: z.enum([
    'call',
    'meeting',
    'note',
    'stage_change',
    'assignment',
    'site_visit',
    'whatsapp',
    'email',
    'task',
  ]).default('whatsapp'),
  title: z.string().min(1),
  description: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ActivitySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parsed.error.format() }, { status: 400 });
    }

    const { company_id, lead_id, actor_name, activity_type, title, description } = parsed.data;

    const activity = db.addLeadActivity(company_id, {
      company_id,
      lead_id,
      actor_member_id: actor_name,
      activity_type,
      title,
      description,
    });

    // Update lead's last contacted timestamp
    db.updateLead(company_id, lead_id, {
      last_contacted_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, activity });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to log activity' }, { status: 500 });
  }
}
