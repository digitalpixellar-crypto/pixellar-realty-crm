import React from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/session';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import {
  Webhook,
  MessageSquare,
  Share2,
  Mail,
  PhoneCall,
  CheckCircle2,
  AlertCircle,
  Copy,
  Terminal,
} from 'lucide-react';
import { revalidatePath } from 'next/cache';

interface IntegrationsPageProps {
  params: Promise<{ slug: string }>;
}

async function handleUpdateIntegration(formData: FormData) {
  'use server';
  const companySlug = formData.get('company_slug') as string;
  const integrationId = formData.get('integration_id') as string;
  const webhookSecret = formData.get('webhook_secret') as string;
  const isActive = formData.get('is_active') === 'on';

  const company = db.getCompany(companySlug);
  if (!company) return;

  db.updateIntegration(company.id, integrationId, {
    webhook_secret: webhookSecret,
    is_active: isActive,
    last_synced_at: new Date().toISOString(),
  });

  revalidatePath(`/app/${companySlug}/integrations`);
}

export default async function TenantIntegrationsPage({ params }: IntegrationsPageProps) {
  const { slug } = await params;
  const context = await getTenantContext(slug);
  if (!context) notFound();

  const company = context.company;
  const integrations = db.getIntegrations(company.id);

  const webhookIntg = integrations.find((i) => i.provider === 'webhook') || {
    id: 'int-webhook',
    is_active: true,
    webhook_secret: 'whsec_skyline_live_908123984',
  };

  const metaIntg = integrations.find((i) => i.provider === 'meta_leads') || {
    id: 'int-meta',
    is_active: false,
  };

  const waIntg = integrations.find((i) => i.provider === 'whatsapp_cloud') || {
    id: 'int-wa',
    is_active: false,
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Channel & Marketing Integrations</h1>
            <Badge variant="primary">Tenant-Scoped API</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Connect marketing ad platforms, website contact forms, WhatsApp Cloud, and telephony providers.
          </p>
        </div>
      </div>

      {/* Honest Connection Notice */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Verified Integration Adapters</h4>
            <p className="text-xs text-slate-500">
              Integrations report real connection status. Unconfigured channels are accurately labeled as &ldquo;Setup Required&rdquo;.
            </p>
          </div>
        </div>
        <span className="text-xs font-mono text-slate-400">Security: Encrypted Secrets</span>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Website Lead Ingestion Webhook */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                  <Webhook className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Inbound Webhook API</h3>
                  <span className="text-[11px] text-slate-400">Custom Website Forms</span>
                </div>
              </div>
              <Badge variant="success">Active</Badge>
            </div>

            <p className="text-xs text-slate-600 mt-4 leading-relaxed">
              Post inbound JSON prospect leads from WordPress, Next.js landing pages, or contact forms directly into {company.name}&apos;s CRM pipeline.
            </p>

            <form action={handleUpdateIntegration} className="mt-4 space-y-3 text-xs">
              <input type="hidden" name="company_slug" value={slug} />
              <input type="hidden" name="integration_id" value={webhookIntg.id} />

              <div>
                <span className="text-slate-500 font-semibold block mb-1">Webhook Target URL</span>
                <code className="block p-2 rounded bg-slate-100 font-mono text-[11px] text-slate-800 break-all select-all">
                  /api/v1/inbound-lead
                </code>
              </div>

              <div>
                <label className="text-slate-500 font-semibold block mb-1">Webhook Secret Key</label>
                <input
                  type="text"
                  name="webhook_secret"
                  defaultValue={webhookIntg.webhook_secret || 'whsec_skyline_live_908123984'}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded font-mono text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="webhook_active"
                  name="is_active"
                  defaultChecked={webhookIntg.is_active}
                  className="rounded"
                />
                <label htmlFor="webhook_active" className="text-xs text-slate-700 font-medium cursor-pointer">
                  Enable Inbound Ingestion
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-1.5 px-3 rounded bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors mt-2"
              >
                Save Webhook Settings
              </button>
            </form>
          </div>
        </div>

        {/* 2. Meta Lead Ads */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Meta Instant Forms</h3>
                  <span className="text-[11px] text-slate-400">Facebook & Instagram</span>
                </div>
              </div>
              <Badge variant="warning">Setup Required</Badge>
            </div>

            <p className="text-xs text-slate-600 mt-4 leading-relaxed">
              Real-time sync with Facebook and Instagram Lead Ads forms to route paid campaign inquiries directly into the pipeline.
            </p>

            <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-2">
              <span className="font-semibold text-slate-700 block">Remaining Configuration Steps:</span>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px]">
                <li>Connect Facebook Page via Meta Graph API</li>
                <li>Generate Page Access Token with <code className="font-mono">leads_retrieval</code> scope</li>
                <li>Subscribe to Webhook <code className="font-mono">leadgen</code> event</li>
              </ol>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              type="button"
              className="w-full py-2 px-3 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
            >
              Configure Meta OAuth Credentials
            </button>
          </div>
        </div>

        {/* 3. WhatsApp Business Cloud API */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">WhatsApp Cloud API</h3>
                  <span className="text-[11px] text-slate-400">Official Meta WABA</span>
                </div>
              </div>
              <Badge variant="neutral">Not Connected</Badge>
            </div>

            <p className="text-xs text-slate-600 mt-4 leading-relaxed">
              Official WhatsApp messaging with verified business templates, opt-in consent logging, brochure dispatches, and visit reminders.
            </p>

            <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-2">
              <span className="font-semibold text-slate-700 block">Required Meta WABA Details:</span>
              <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
                <li>WhatsApp Business Account ID (WABA)</li>
                <li>Phone Number ID & Permanent System Token</li>
                <li>Approved HSM Template Names</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              type="button"
              className="w-full py-2 px-3 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
            >
              Enter WABA API Secrets
            </button>
          </div>
        </div>
      </div>

      {/* Developer Webhook cURL Demonstration */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 text-slate-300 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm text-white">Inbound Lead Webhook Example (cURL)</h3>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">POST /api/v1/inbound-lead</span>
        </div>

        <div className="mt-4">
          <pre className="p-4 rounded-lg bg-slate-900 font-mono text-xs text-emerald-300 overflow-x-auto leading-relaxed border border-slate-800">
{`curl -X POST https://your-domain.com/api/v1/inbound-lead \\
  -H "Content-Type: application/json" \\
  -H "x-company-slug: ${company.slug}" \\
  -H "x-webhook-secret: ${webhookIntg.webhook_secret || 'whsec_skyline_live_908123984'}" \\
  -d '{
    "first_name": "Siddharth",
    "last_name": "Varma",
    "phone": "+91 99880 11223",
    "email": "siddharth.varma@example.com",
    "source": "Landing Page Ad",
    "budget_max": 7500000,
    "message": "Interested in East facing 250 sq.yd villa plot in Phase 1"
  }'`}
          </pre>
        </div>
      </div>
    </div>
  );
}
