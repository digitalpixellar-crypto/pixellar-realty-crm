import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const InboundLeadSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().min(8, 'Valid phone number is required'),
  alternate_phone: z.string().optional(),
  source: z.string().default('Website Inbound Form'),
  campaign: z.string().optional(),
  interested_project_id: z.string().optional(),
  interested_property_type: z.enum(['villa_plots', 'apartments', 'villas', 'farm_plots', 'commercial']).optional(),
  budget_min: z.number().optional(),
  budget_max: z.number().optional(),
  preferred_location: z.string().optional(),
  message: z.string().optional(),
  custom_fields: z.record(z.string(), z.any()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const companySlug = req.headers.get('x-company-slug') || 'skyline-developers';
    const webhookSecret = req.headers.get('x-webhook-secret');

    const company = db.getCompany(companySlug);
    if (!company) {
      return NextResponse.json({ error: 'Company workspace not found' }, { status: 404 });
    }

    // Check integration webhook secret if configured
    const integrations = db.getIntegrations(company.id);
    const webhookIntg = integrations.find((i) => i.provider === 'webhook' && i.is_active);

    if (webhookIntg?.webhook_secret && webhookSecret && webhookIntg.webhook_secret !== webhookSecret) {
      return NextResponse.json({ error: 'Unauthorized: Invalid webhook secret' }, { status: 401 });
    }

    const body = await req.json();
    const parseResult = InboundLeadSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const data = parseResult.data;

    // Resolve default initial stage
    const stages = db.getPipelineStages(company.id);
    const initialStage = stages.find((s) => s.stage_type === 'new') || stages[0];

    const lead = db.createLead(company.id, {
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email || undefined,
      phone: data.phone,
      alternate_phone: data.alternate_phone,
      source: data.source,
      campaign: data.campaign,
      interested_project_id: data.interested_project_id,
      interested_property_type: data.interested_property_type,
      budget_min: data.budget_min,
      budget_max: data.budget_max,
      preferred_location: data.preferred_location,
      stage_id: initialStage.id,
      priority: 'medium',
      temperature: 'warm',
      buying_timeline: '1_month',
      tags: ['Webhook Inbound'],
      custom_fields: {
        ...(data.custom_fields || {}),
        inquiry_message: data.message,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Lead captured successfully',
        lead: {
          id: lead.id,
          lead_number: lead.lead_number,
          first_name: lead.first_name,
          is_duplicate: lead.is_duplicate,
          assigned_member_id: lead.assigned_member_id,
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Inbound lead webhook error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
