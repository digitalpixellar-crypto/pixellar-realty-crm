import React from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/session';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { formatINR } from '@/components/ui/StatCard';
import {
  PhoneCall,
  ArrowRight,
  Plus,
  Eye,
  Building2,
  Table,
} from 'lucide-react';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { WhatsAppActionModal } from '@/components/leads/WhatsAppActionModal';

interface KanbanPageProps {
  params: Promise<{ slug: string }>;
}

async function handleMoveStage(formData: FormData) {
  'use server';
  const companySlug = formData.get('company_slug') as string;
  const leadId = formData.get('lead_id') as string;
  const targetStageId = formData.get('target_stage_id') as string;

  const company = db.getCompany(companySlug);
  if (!company) return;

  db.updateLead(company.id, leadId, { stage_id: targetStageId });
  revalidatePath(`/app/${companySlug}/leads/kanban`);
  revalidatePath(`/app/${companySlug}/dashboard`);
}

export default async function TenantKanbanPage({ params }: KanbanPageProps) {
  const { slug } = await params;
  const context = await getTenantContext(slug);
  if (!context) notFound();

  const company = context.company;
  const stages = db.getPipelineStages(company.id);
  const leads = db.getLeads(company.id);
  const projects = db.getProjects(company.id);
  const members = db.getCompanyMembers(company.id);

  return (
    <div className="space-y-6 max-w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sales Pipeline Kanban</h1>
            <Badge variant="primary">{leads.length} Total Leads</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Visual pipeline progression for {company.name}.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href={`/app/${slug}/leads`}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg shadow-sm transition-colors"
          >
            <Table className="w-4 h-4 text-slate-500" />
            <span>Table View</span>
          </Link>
          <Link
            href={`/app/${slug}/leads?action=new`}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Lead</span>
          </Link>
        </div>
      </div>

      {/* Horizontal Scrolling Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-6 items-start">
        {stages.map((stage) => {
          const stageLeads = leads.filter((l) => l.stage_id === stage.id);
          const totalBudget = stageLeads.reduce((sum, l) => sum + (l.budget_max || l.budget_min || 0), 0);

          return (
            <div
              key={stage.id}
              className="w-80 flex-shrink-0 rounded-xl bg-slate-100/80 border border-slate-200/80 flex flex-col shadow-sm"
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-slate-200 bg-white rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: stage.color_hex }} />
                    <h3 className="font-bold text-sm text-slate-900 truncate">{stage.name}</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                    {stageLeads.length}
                  </span>
                </div>
                {totalBudget > 0 && (
                  <div className="text-[11px] text-slate-500 mt-1 font-medium">
                    Pipeline: <span className="text-slate-800 font-semibold">{formatINR(totalBudget)}</span>
                  </div>
                )}
              </div>

              {/* Column Card Body */}
              <div className="p-3 space-y-3 min-h-[300px] max-h-[72vh] overflow-y-auto">
                {stageLeads.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">No leads in this stage</div>
                ) : (
                  stageLeads.map((lead) => {
                    const project = projects.find((p) => p.id === lead.interested_project_id);
                    const agent = members.find((m) => m.id === lead.assigned_member_id);

                    return (
                      <div
                        key={lead.id}
                        className="rounded-lg bg-white border border-slate-200 p-3.5 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/app/${slug}/leads/${lead.id}`}
                            className="font-bold text-sm text-slate-900 hover:text-brand-600 transition-colors"
                          >
                            {lead.first_name} {lead.last_name || ''}
                          </Link>
                          <StatusBadge status={lead.temperature} />
                        </div>

                        <div className="mt-2 text-xs text-slate-500 space-y-1">
                          <div className="flex items-center justify-between">
                            <a
                              href={`tel:${lead.phone}`}
                              className="flex items-center gap-1.5 font-mono text-brand-600 hover:underline font-semibold"
                            >
                              <PhoneCall className="w-3 h-3 text-slate-400" />
                              <span>{lead.phone}</span>
                            </a>
                            <WhatsAppActionModal
                              lead={lead}
                              company={company}
                              project={project}
                              agentName={agent?.name || 'Sales Specialist'}
                              compact={true}
                            />
                          </div>
                          {project && (
                            <div className="flex items-center gap-1.5 text-slate-600 truncate">
                              <Building2 className="w-3 h-3 text-slate-400" />
                              <span className="truncate">{project.name}</span>
                            </div>
                          )}
                          {lead.budget_max && (
                            <div className="text-[11px] font-semibold text-emerald-700">
                              Budget: {formatINR(lead.budget_max)}
                            </div>
                          )}
                        </div>

                        {/* Move Stage Quick Action */}
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-[11px] text-slate-400 truncate">
                            {agent ? agent.name.split(' ')[0] : 'Unassigned'}
                          </span>

                          <form action={handleMoveStage} className="flex items-center gap-1">
                            <input type="hidden" name="company_slug" value={slug} />
                            <input type="hidden" name="lead_id" value={lead.id} />
                            <select
                              name="target_stage_id"
                              defaultValue={lead.stage_id}
                              className="text-[11px] font-medium bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 focus:outline-none cursor-pointer"
                            >
                              {stages.map((st) => (
                                <option key={st.id} value={st.id}>
                                  → {st.name}
                                </option>
                              ))}
                            </select>
                            <button
                              type="submit"
                              className="px-1.5 py-0.5 rounded bg-brand-50 hover:bg-brand-100 text-brand-700 text-[10px] font-bold transition-colors"
                              title="Advance lead to selected stage"
                            >
                              Move
                            </button>
                          </form>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
