import React from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/session';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { formatINR } from '@/components/ui/StatCard';
import {
  PhoneCall,
  Mail,
  Calendar,
  Building2,
  Clock,
  Plus,
  Compass,
  FileCheck2,
  History,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { WhatsAppActionModal } from '@/components/leads/WhatsAppActionModal';

interface LeadProfilePageProps {
  params: Promise<{ slug: string; leadId: string }>;
}

async function handleLogCall(formData: FormData) {
  'use server';
  const companySlug = formData.get('company_slug') as string;
  const leadId = formData.get('lead_id') as string;
  const outcome = formData.get('outcome') as string;
  const notes = formData.get('notes') as string;
  const nextFollowup = formData.get('next_followup') as string;

  const company = db.getCompany(companySlug);
  if (!company) return;

  db.addLeadActivity(company.id, {
    company_id: company.id,
    lead_id: leadId,
    actor_member_id: 'mem-arjun-04',
    activity_type: 'call',
    title: `Call Logged: ${outcome}`,
    description: notes,
  });

  const updates: any = { last_contacted_at: new Date().toISOString() };
  if (nextFollowup) {
    updates.next_followup_at = new Date(nextFollowup).toISOString();

    // Also auto-create a task
    db.createTask(company.id, {
      lead_id: leadId,
      assigned_member_id: 'mem-arjun-04',
      creator_member_id: 'mem-arjun-04',
      task_type: 'call',
      title: `Scheduled Follow-up: ${outcome}`,
      description: notes,
      priority: 'high',
      due_date: new Date(nextFollowup).toISOString(),
      status: 'pending',
    });
  }

  db.updateLead(company.id, leadId, updates);

  revalidatePath(`/app/${companySlug}/leads/${leadId}`);
  revalidatePath(`/app/${companySlug}/dashboard`);
}

async function handleScheduleSiteVisit(formData: FormData) {
  'use server';
  const companySlug = formData.get('company_slug') as string;
  const leadId = formData.get('lead_id') as string;
  const projectId = formData.get('project_id') as string;
  const visitDateTime = formData.get('visit_datetime') as string;
  const pickupLocation = formData.get('pickup_location') as string;
  const transportRequired = formData.get('transport_required') === 'on';

  const company = db.getCompany(companySlug);
  if (!company) return;

  db.createSiteVisit(company.id, {
    lead_id: leadId,
    project_id: projectId,
    assigned_member_id: 'mem-arjun-04',
    scheduled_at: new Date(visitDateTime).toISOString(),
    pickup_location: pickupLocation || undefined,
    transport_required: transportRequired,
    status: 'scheduled',
  });

  // Move stage to Site Visit Scheduled
  const stages = db.getPipelineStages(company.id);
  const visitStage = stages.find((s) => s.stage_type === 'site_visit_scheduled');
  if (visitStage) {
    db.updateLead(company.id, leadId, { stage_id: visitStage.id });
  }

  revalidatePath(`/app/${companySlug}/leads/${leadId}`);
  revalidatePath(`/app/${companySlug}/site-visits`);
  revalidatePath(`/app/${companySlug}/dashboard`);
}

export default async function LeadProfilePage({ params }: LeadProfilePageProps) {
  const { slug, leadId } = await params;
  const context = await getTenantContext(slug);
  if (!context) notFound();

  const company = context.company;
  const lead = db.getLead(company.id, leadId);
  if (!lead) notFound();

  const project = db.getProject(company.id, lead.interested_project_id || '');
  const stage = db.getPipelineStages(company.id).find((s) => s.id === lead.stage_id);
  const agent = db.getMember(lead.assigned_member_id || '');
  const activities = db.getLeadActivities(company.id, lead.id);
  const projects = db.getProjects(company.id);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Back Link */}
      <Link
        href={`/app/${slug}/leads`}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Leads Directory</span>
      </Link>

      {/* Hero Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {lead.first_name} {lead.last_name || ''}
            </h1>
            <StatusBadge status={lead.temperature} />
            <StatusBadge status={lead.priority} />
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
            <span className="font-mono font-semibold text-slate-700">{lead.lead_number}</span>
            <span>•</span>
            <span>Source: <strong className="text-slate-800">{lead.source}</strong></span>
            <span>•</span>
            <span>Created: {new Date(lead.created_at).toLocaleDateString('en-IN')}</span>
            {lead.last_contacted_at && (
              <>
                <span>•</span>
                <span>Last Contact: {new Date(lead.last_contacted_at).toLocaleString('en-IN', { timeZone: company.timezone })}</span>
              </>
            )}
          </div>
        </div>

        {/* Fast Action Buttons (Call, WhatsApp, Email) */}
        <div className="flex items-center gap-2">
          <a
            href={`tel:${lead.phone}`}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold shadow-sm transition-all"
          >
            <PhoneCall className="w-4 h-4 text-emerald-400" />
            <span>Call</span>
          </a>

          <WhatsAppActionModal
            lead={lead}
            company={company}
            project={project}
            agentName={agent?.name || 'Sales Specialist'}
          />

          {lead.email && (
            <a
              href={`mailto:${lead.email}`}
              className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors"
              title="Send Email"
            >
              <Mail className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Prospect Details & Requirements */}
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
              Prospect Information
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Primary Phone</span>
                <a href={`tel:${lead.phone}`} className="text-brand-600 font-semibold text-sm hover:underline">
                  {lead.phone}
                </a>
              </div>
              {lead.alternate_phone && (
                <div>
                  <span className="text-slate-400 block font-medium">Alternate Phone</span>
                  <span className="text-slate-800 font-semibold">{lead.alternate_phone}</span>
                </div>
              )}
              {lead.email && (
                <div>
                  <span className="text-slate-400 block font-medium">Email Address</span>
                  <span className="text-slate-800 font-semibold">{lead.email}</span>
                </div>
              )}
              <div>
                <span className="text-slate-400 block font-medium">Assigned Sales Agent</span>
                <span className="text-slate-800 font-semibold">{agent?.name || 'Unassigned'}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
              Property Preferences
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Interested Project</span>
                <span className="text-slate-900 font-semibold text-sm">{project?.name || 'Open to All Projects'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Property Category</span>
                <span className="text-slate-800 font-semibold capitalize">
                  {lead.interested_property_type ? lead.interested_property_type.replace('_', ' ') : 'Plots / Apartments'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Budget Range</span>
                <span className="text-slate-900 font-bold text-sm">
                  {lead.budget_max ? formatINR(lead.budget_max) : 'Not specified'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Buying Timeline</span>
                <span className="text-slate-800 font-semibold capitalize">{lead.buying_timeline.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interaction Workflows & Activity Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Outcome Logger */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-bold text-sm text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-emerald-600" />
              <span>Log Call Outcome & Follow-up</span>
            </h3>

            <form action={handleLogCall} className="mt-4 space-y-4 text-sm">
              <input type="hidden" name="company_slug" value={slug} />
              <input type="hidden" name="lead_id" value={lead.id} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Call Outcome *
                  </label>
                  <select
                    name="outcome"
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="Interested - Site Visit Requested">Interested - Site Visit Requested</option>
                    <option value="Interested - Requested Price Quote">Interested - Requested Price Quote</option>
                    <option value="Follow-up Call Scheduled">Follow-up Call Scheduled</option>
                    <option value="Left Voicemail / Unanswered">Left Voicemail / Unanswered</option>
                    <option value="Budget Mismatch">Budget Mismatch</option>
                    <option value="Not Interested / Dropped">Not Interested / Dropped</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Next Follow-up Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    name="next_followup"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Discussion Notes & Observations
                </label>
                <textarea
                  name="notes"
                  rows={2}
                  required
                  placeholder="e.g. Prospect discussed 250 sq.yd corner plot. Prefers East facing. Wants to visit on Saturday morning."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-sm"
                >
                  Save Call Log & Update Agenda
                </button>
              </div>
            </form>
          </div>

          {/* Schedule Site Visit Module */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-bold text-sm text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Compass className="w-4 h-4 text-brand-600" />
              <span>Schedule Project Site Visit</span>
            </h3>

            <form action={handleScheduleSiteVisit} className="mt-4 space-y-4 text-sm">
              <input type="hidden" name="company_slug" value={slug} />
              <input type="hidden" name="lead_id" value={lead.id} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Project *
                  </label>
                  <select
                    name="project_id"
                    defaultValue={lead.interested_project_id || projects[0]?.id}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    name="visit_datetime"
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Pickup Location
                  </label>
                  <input
                    type="text"
                    name="pickup_location"
                    placeholder="e.g. Inorbit Mall / Home pickup"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input type="checkbox" id="transport_required" name="transport_required" className="rounded" />
                  <label htmlFor="transport_required" className="text-xs font-medium text-slate-700 cursor-pointer">
                    Cab Required
                  </label>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition-colors shadow-sm"
                >
                  Confirm Site Visit
                </button>
              </div>
            </form>
          </div>

          {/* Activity Timeline Stream */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-bold text-sm text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-500" />
              <span>Activity History & Audit Timeline ({activities.length})</span>
            </h3>

            <div className="mt-4 space-y-4">
              {activities.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No interactions logged yet.</p>
              ) : (
                activities.map((act) => (
                  <div key={act.id} className="flex gap-3 text-xs">
                    <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 text-slate-600 font-bold">
                      ●
                    </div>
                    <div className="flex-1 border-b border-slate-100 pb-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900">{act.title}</span>
                        <span className="text-slate-400">
                          {new Date(act.created_at).toLocaleString('en-IN', { timeZone: company.timezone })}
                        </span>
                      </div>
                      {act.description && <p className="text-slate-600 mt-1">{act.description}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
