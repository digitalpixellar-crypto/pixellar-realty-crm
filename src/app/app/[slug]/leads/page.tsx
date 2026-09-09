import React from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/session';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import {
  Users,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  PhoneCall,
  GitMerge,
  Eye,
  Building2,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';

interface LeadsPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ stage?: string; search?: string; action?: string }>;
}

async function handleCreateLead(formData: FormData) {
  'use server';
  const companySlug = formData.get('company_slug') as string;
  const company = db.getCompany(companySlug);
  if (!company) return;

  const firstName = formData.get('first_name') as string;
  const lastName = formData.get('last_name') as string;
  const phone = formData.get('phone') as string;
  const email = formData.get('email') as string;
  const source = formData.get('source') as string;
  const stageId = formData.get('stage_id') as string;
  const projectId = formData.get('project_id') as string;
  const budgetMin = parseFloat(formData.get('budget_min') as string) || undefined;
  const budgetMax = parseFloat(formData.get('budget_max') as string) || undefined;
  const priority = formData.get('priority') as any || 'medium';
  const temperature = formData.get('temperature') as any || 'warm';
  const buyingTimeline = formData.get('buying_timeline') as any || '1_month';
  const assignedMemberId = formData.get('assigned_member_id') as string || undefined;

  db.createLead(company.id, {
    first_name: firstName,
    last_name: lastName || undefined,
    phone,
    email: email || undefined,
    source: source || 'Direct Walk-in',
    stage_id: stageId,
    interested_project_id: projectId || undefined,
    budget_min: budgetMin,
    budget_max: budgetMax,
    priority,
    temperature,
    buying_timeline: buyingTimeline,
    assigned_member_id: assignedMemberId,
    tags: ['Direct Manual Entry'],
    custom_fields: {},
  });

  revalidatePath(`/app/${companySlug}/leads`);
  revalidatePath(`/app/${companySlug}/dashboard`);
}

async function handleMergeDuplicates(formData: FormData) {
  'use server';
  const companySlug = formData.get('company_slug') as string;
  const company = db.getCompany(companySlug);
  if (!company) return;

  const primaryLeadId = formData.get('primary_lead_id') as string;
  const secondaryLeadId = formData.get('secondary_lead_id') as string;

  db.mergeLeads(company.id, primaryLeadId, secondaryLeadId, 'system');
  revalidatePath(`/app/${companySlug}/leads`);
}

export default async function TenantLeadsPage({ params, searchParams }: LeadsPageProps) {
  const { slug } = await params;
  const { stage: filterStage, search: querySearch, action } = await searchParams;

  const context = await getTenantContext(slug);
  if (!context) notFound();

  const company = context.company;
  const stages = db.getPipelineStages(company.id);
  const projects = db.getProjects(company.id);
  const members = db.getCompanyMembers(company.id);

  const leads = db.getLeads(company.id, {
    stageId: filterStage,
    search: querySearch,
  });

  const duplicates = leads.filter((l) => l.is_duplicate);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Lead Management</h1>
            <Badge variant="primary">{leads.length} Records</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Capture, qualify, assign, and track property buyer inquiries.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href={`/app/${slug}/leads/kanban`}
            className="px-3 py-2 text-sm font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg shadow-sm transition-colors"
          >
            Kanban Board →
          </Link>
          <a
            href={`#create-lead-modal`}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Lead</span>
          </a>
        </div>
      </div>

      {/* Duplicate Alert Banner if duplicates exist */}
      {duplicates.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <GitMerge className="w-5 h-5 text-amber-700" />
            <div>
              <span className="text-sm font-bold text-amber-900">
                {duplicates.length} Duplicate {duplicates.length === 1 ? 'record' : 'records'} detected within workspace
              </span>
              <p className="text-xs text-amber-700 mt-0.5">
                Normalized phone numbers matched existing prospect profiles.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/app/${slug}/leads`}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              !filterStage ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Stages ({db.getLeads(company.id).length})
          </Link>
          {stages.map((stg) => {
            const count = db.getLeads(company.id, { stageId: stg.id }).length;
            const isSelected = filterStage === stg.id;
            return (
              <Link
                key={stg.id}
                href={`/app/${slug}/leads?stage=${stg.id}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  isSelected ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: stg.color_hex }} />
                <span>{stg.name}</span>
                <span className="text-[10px] opacity-75">({count})</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Leads Data Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Lead #</th>
                <th className="px-6 py-3.5">Prospect Name</th>
                <th className="px-6 py-3.5">Phone & Contact</th>
                <th className="px-6 py-3.5">Interested Project</th>
                <th className="px-6 py-3.5">Stage</th>
                <th className="px-6 py-3.5">Assigned Agent</th>
                <th className="px-6 py-3.5">Temp / Priority</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    No leads found matching current filter criteria.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => {
                  const project = projects.find((p) => p.id === lead.interested_project_id);
                  const stage = stages.find((s) => s.id === lead.stage_id);
                  const agent = members.find((m) => m.id === lead.assigned_member_id);

                  return (
                    <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-600">
                        {lead.lead_number}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">
                          {lead.first_name} {lead.last_name || ''}
                          {lead.is_duplicate && (
                            <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                              Duplicate
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">{lead.source}</div>
                      </td>
                      <td className="px-6 py-4">
                        <a
                          href={`tel:${lead.phone}`}
                          className="font-mono text-xs text-brand-600 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <PhoneCall className="w-3 h-3" />
                          {lead.phone}
                        </a>
                        {lead.email && <div className="text-xs text-slate-500 mt-0.5">{lead.email}</div>}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-800">
                        {project?.name || 'Any Project'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: `${stage?.color_hex || '#3B82F6'}18`,
                            color: stage?.color_hex || '#3B82F6',
                          }}
                        >
                          {stage?.name || 'Inbound'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {agent ? (
                          <span className="font-medium text-slate-800">{agent.name}</span>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 flex items-center gap-1.5">
                        <StatusBadge status={lead.temperature} />
                        <StatusBadge status={lead.priority} />
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Link
                          href={`/app/${slug}/leads/${lead.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-800 hover:underline"
                        >
                          <span>Profile</span>
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Lead Modal Form */}
      <div id="create-lead-modal" className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
          <Plus className="w-5 h-5 text-brand-600" />
          <span>Manual Lead Intake Form</span>
        </h3>

        <form action={handleCreateLead} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <input type="hidden" name="company_slug" value={slug} />

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              First Name *
            </label>
            <input
              type="text"
              name="first_name"
              required
              placeholder="e.g. Ramesh"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Last Name
            </label>
            <input
              type="text"
              name="last_name"
              placeholder="e.g. Chowdary"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Phone Number *
            </label>
            <input
              type="text"
              name="phone"
              required
              placeholder="+91 98765 43210"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Email</label>
            <input
              type="email"
              name="email"
              placeholder="ramesh@gmail.com"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Source</label>
            <select
              name="source"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="Website">Website</option>
              <option value="Meta Ads">Meta Ads</option>
              <option value="Direct Walk-in">Direct Walk-in</option>
              <option value="Channel Partner">Channel Partner</option>
              <option value="Referral">Referral</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Interested Project
            </label>
            <select
              name="project_id"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Any / Not Decided</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Pipeline Stage
            </label>
            <select
              name="stage_id"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Lead Temperature
            </label>
            <select
              name="temperature"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="hot">Hot (Ready to visit / buy)</option>
              <option value="warm">Warm (Exploring actively)</option>
              <option value="cold">Cold (Future prospect)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Assigned Agent
            </label>
            <select
              name="assigned_member_id"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Auto-allocate (Round-robin)</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.title || m.role})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3 pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-sm transition-all"
            >
              Save & Ingest Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
