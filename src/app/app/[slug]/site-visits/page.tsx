import React from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/session';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import {
  Compass,
  Plus,
  Car,
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  User,
  Star,
  Building2,
} from 'lucide-react';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';

interface SiteVisitsPageProps {
  params: Promise<{ slug: string }>;
}

async function handleUpdateVisitOutcome(formData: FormData) {
  'use server';
  const companySlug = formData.get('company_slug') as string;
  const visitId = formData.get('visit_id') as string;
  const status = formData.get('status') as any;
  const feedback = formData.get('feedback') as string;
  const objections = formData.get('objections') as string;
  const rating = parseInt(formData.get('rating') as string, 10) || undefined;
  const nextAction = formData.get('next_action') as string;

  const company = db.getCompany(companySlug);
  if (!company) return;

  db.updateSiteVisit(company.id, visitId, {
    status,
    feedback,
    objections,
    rating,
    next_action: nextAction,
  });

  revalidatePath(`/app/${companySlug}/site-visits`);
  revalidatePath(`/app/${companySlug}/dashboard`);
}

async function handleScheduleVisit(formData: FormData) {
  'use server';
  const companySlug = formData.get('company_slug') as string;
  const company = db.getCompany(companySlug);
  if (!company) return;

  const leadId = formData.get('lead_id') as string;
  const projectId = formData.get('project_id') as string;
  const scheduledAt = formData.get('scheduled_at') as string;
  const pickupLocation = formData.get('pickup_location') as string;
  const transportRequired = formData.get('transport_required') === 'on';
  const assignedMemberId = formData.get('assigned_member_id') as string;

  db.createSiteVisit(company.id, {
    lead_id: leadId,
    project_id: projectId,
    assigned_member_id: assignedMemberId,
    scheduled_at: new Date(scheduledAt).toISOString(),
    pickup_location: pickupLocation || undefined,
    transport_required: transportRequired,
    status: 'scheduled',
  });

  revalidatePath(`/app/${companySlug}/site-visits`);
  revalidatePath(`/app/${companySlug}/dashboard`);
}

export default async function TenantSiteVisitsPage({ params }: SiteVisitsPageProps) {
  const { slug } = await params;
  const context = await getTenantContext(slug);
  if (!context) notFound();

  const company = context.company;
  const visits = db.getSiteVisits(company.id);
  const leads = db.getLeads(company.id);
  const projects = db.getProjects(company.id);
  const members = db.getCompanyMembers(company.id);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Site Visits & Field Tours</h1>
            <Badge variant="primary">{visits.length} Visits</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Coordinate property inspections, transport arrangements, customer objections, and conversion outcomes.
          </p>
        </div>

        <a
          href="#schedule-visit-form"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Visit</span>
        </a>
      </div>

      {/* Visits Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="font-bold text-slate-900">Visits Schedule</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Lead / Prospect</th>
                <th className="px-6 py-3.5">Project</th>
                <th className="px-6 py-3.5">Scheduled Time</th>
                <th className="px-6 py-3.5">Transport / Pickup</th>
                <th className="px-6 py-3.5">Agent</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Log Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No site visits scheduled yet.
                  </td>
                </tr>
              ) : (
                visits.map((visit) => {
                  const lead = leads.find((l) => l.id === visit.lead_id);
                  const project = projects.find((p) => p.id === visit.project_id);
                  const agent = members.find((m) => m.id === visit.assigned_member_id);

                  return (
                    <tr key={visit.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">
                          {lead ? `${lead.first_name} ${lead.last_name || ''}` : 'Lead'}
                        </div>
                        {lead && <div className="text-xs text-slate-500 font-mono">{lead.phone}</div>}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-800">
                        {project?.name || 'Project'}
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-700">
                        {new Date(visit.scheduled_at).toLocaleString('en-IN', { timeZone: company.timezone })}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {visit.transport_required ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <Car className="w-3 h-3" />
                            {visit.pickup_location || 'Cab Arranged'}
                          </span>
                        ) : (
                          <span className="text-slate-400">Self Transport</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-800">
                        {agent?.name || 'Agent'}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={visit.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <a
                          href={`#outcome-${visit.id}`}
                          className="text-xs font-semibold text-brand-600 hover:text-brand-800 hover:underline"
                        >
                          Update Outcome →
                        </a>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Outcome Logging Form Cards for Open Visits */}
      {visits.map((visit) => (
        <div key={`outcome-card-${visit.id}`} id={`outcome-${visit.id}`} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Compass className="w-5 h-5 text-brand-600" />
            <span>Record Site Visit Outcome & Customer Feedback</span>
          </h3>

          <form action={handleUpdateVisitOutcome} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <input type="hidden" name="company_slug" value={slug} />
            <input type="hidden" name="visit_id" value={visit.id} />

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Visit Status *
              </label>
              <select
                name="status"
                defaultValue={visit.status}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="scheduled">Scheduled</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed Successfully</option>
                <option value="cancelled">Cancelled by Buyer</option>
                <option value="no_show">No-Show / Reschedule</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Customer Interest Rating (1 - 5)
              </label>
              <select
                name="rating"
                defaultValue={visit.rating || 5}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="5">⭐⭐⭐⭐⭐ 5 - Highly Enthusiastic</option>
                <option value="4">⭐⭐⭐⭐ 4 - Very Interested</option>
                <option value="3">⭐⭐⭐ 3 - Neutral / Comparing</option>
                <option value="2">⭐⭐ 2 - Hesitant</option>
                <option value="1">⭐ 1 - Not Interested</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Next Action / Follow-up Plan
              </label>
              <input
                type="text"
                name="next_action"
                defaultValue={visit.next_action || ''}
                placeholder="e.g. Send formal price quotation and payment schedule"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Customer Feedback & Objections Raised
              </label>
              <textarea
                name="feedback"
                rows={2}
                defaultValue={visit.feedback || ''}
                placeholder="e.g. Liked Plot 103 and road width. Requested 2% discount on clubhouse fees."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="md:col-span-3 flex justify-end gap-2">
              <a href="#" className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg">
                Close
              </a>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition-colors shadow-sm"
              >
                Save Visit Feedback
              </button>
            </div>
          </form>
        </div>
      ))}

      {/* Schedule Visit Form */}
      <div id="schedule-visit-form" className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
          <Plus className="w-5 h-5 text-brand-600" />
          <span>Schedule New Site Visit</span>
        </h3>

        <form action={handleScheduleVisit} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <input type="hidden" name="company_slug" value={slug} />

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Select Prospect Lead *
            </label>
            <select
              name="lead_id"
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.first_name} {l.last_name || ''} ({l.phone})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Select Project *
            </label>
            <select
              name="project_id"
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
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
              name="scheduled_at"
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Assigned Field Agent
            </label>
            <select
              name="assigned_member_id"
              defaultValue={context.member.id}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.role})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Pickup Point / Meeting Location
            </label>
            <div className="flex items-center gap-4">
              <input
                type="text"
                name="pickup_location"
                placeholder="e.g. Prospect Residence / Project Site Office"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <div className="flex items-center gap-2 flex-shrink-0">
                <input type="checkbox" id="visit_transport" name="transport_required" className="rounded" />
                <label htmlFor="visit_transport" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Arrange Vehicle
                </label>
              </div>
            </div>
          </div>

          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-sm transition-all"
            >
              Confirm & Schedule Visit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
