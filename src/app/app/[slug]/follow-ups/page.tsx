import React from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/session';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import {
  CalendarCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  PhoneCall,
  Plus,
  User,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';

interface FollowUpsPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}

async function handleCompleteTask(formData: FormData) {
  'use server';
  const companySlug = formData.get('company_slug') as string;
  const taskId = formData.get('task_id') as string;
  const outcome = formData.get('outcome') as string;

  const company = db.getCompany(companySlug);
  if (!company) return;

  db.updateTask(company.id, taskId, {
    status: 'completed',
    outcome: outcome || 'Follow-up executed successfully.',
    completed_at: new Date().toISOString(),
  });

  revalidatePath(`/app/${companySlug}/follow-ups`);
  revalidatePath(`/app/${companySlug}/dashboard`);
}

async function handleCreateTask(formData: FormData) {
  'use server';
  const companySlug = formData.get('company_slug') as string;
  const company = db.getCompany(companySlug);
  if (!company) return;

  const leadId = formData.get('lead_id') as string;
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const taskType = formData.get('task_type') as any || 'call';
  const priority = formData.get('priority') as any || 'high';
  const dueDate = formData.get('due_date') as string;
  const assignedMemberId = formData.get('assigned_member_id') as string;

  db.createTask(company.id, {
    lead_id: leadId || undefined,
    title,
    description,
    task_type: taskType,
    priority,
    due_date: new Date(dueDate).toISOString(),
    status: 'pending',
    assigned_member_id: assignedMemberId,
    creator_member_id: assignedMemberId,
  });

  revalidatePath(`/app/${companySlug}/follow-ups`);
  revalidatePath(`/app/${companySlug}/dashboard`);
}

export default async function TenantFollowUpsPage({ params, searchParams }: FollowUpsPageProps) {
  const { slug } = await params;
  const { tab = 'today' } = await searchParams;

  const context = await getTenantContext(slug);
  if (!context) notFound();

  const company = context.company;
  const allTasks = db.getTasks(company.id);
  const leads = db.getLeads(company.id);
  const members = db.getCompanyMembers(company.id);

  const now = new Date();

  const overdueTasks = allTasks.filter((t) => new Date(t.due_date) < now && t.status === 'pending');
  const todayTasks = allTasks.filter((t) => {
    const d = new Date(t.due_date);
    return d.toDateString() === now.toDateString() && t.status === 'pending';
  });
  const upcomingTasks = allTasks.filter((t) => new Date(t.due_date) > now && t.status === 'pending');
  const completedTasks = allTasks.filter((t) => t.status === 'completed');

  let activeTasks = todayTasks;
  if (tab === 'overdue') activeTasks = overdueTasks;
  if (tab === 'upcoming') activeTasks = upcomingTasks;
  if (tab === 'completed') activeTasks = completedTasks;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Follow-ups & Task Agenda</h1>
            <Badge variant="primary">{allTasks.length} Total</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Ensure no prospect inquiry goes unattended. Durable reminder tracking.
          </p>
        </div>

        <a
          href="#new-task-form"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Task</span>
        </a>
      </div>

      {/* Overdue Warning Alert */}
      {overdueTasks.length > 0 && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <div>
              <h4 className="text-sm font-bold text-rose-900">
                {overdueTasks.length} Overdue Follow-ups require immediate escalation!
              </h4>
              <p className="text-xs text-rose-700">
                Missed calls decrease buyer conversion by over 40%. Call prospect immediately.
              </p>
            </div>
          </div>
          <Link
            href={`/app/${slug}/follow-ups?tab=overdue`}
            className="text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 px-3 py-1.5 rounded-lg transition-colors"
          >
            Resolve Overdue Now →
          </Link>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <Link
          href={`/app/${slug}/follow-ups?tab=today`}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
            tab === 'today' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>Today ({todayTasks.length})</span>
        </Link>
        <Link
          href={`/app/${slug}/follow-ups?tab=overdue`}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
            tab === 'overdue'
              ? 'bg-rose-600 text-white shadow-sm'
              : overdueTasks.length > 0
              ? 'text-rose-600 hover:bg-rose-50'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Overdue ({overdueTasks.length})</span>
        </Link>
        <Link
          href={`/app/${slug}/follow-ups?tab=upcoming`}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
            tab === 'upcoming' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Upcoming ({upcomingTasks.length})</span>
        </Link>
        <Link
          href={`/app/${slug}/follow-ups?tab=completed`}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
            tab === 'completed' ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Completed ({completedTasks.length})</span>
        </Link>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {activeTasks.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">All caught up!</p>
            <p className="text-xs text-slate-500 mt-1">No pending tasks in this agenda view.</p>
          </div>
        ) : (
          activeTasks.map((task) => {
            const lead = leads.find((l) => l.id === task.lead_id);
            const agent = members.find((m) => m.id === task.assigned_member_id);

            return (
              <div
                key={task.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base font-bold text-slate-900">{task.title}</h3>
                    <StatusBadge status={task.priority} />
                    <span className="text-xs uppercase font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                      {task.task_type}
                    </span>
                  </div>

                  {task.description && <p className="text-xs text-slate-600">{task.description}</p>}

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                    {lead && (
                      <Link
                        href={`/app/${slug}/leads/${lead.id}`}
                        className="font-semibold text-brand-600 hover:underline flex items-center gap-1"
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>{lead.first_name} {lead.last_name || ''} ({lead.phone})</span>
                      </Link>
                    )}
                    <span>•</span>
                    <span>Due: <strong>{new Date(task.due_date).toLocaleString('en-IN', { timeZone: company.timezone })}</strong></span>
                    <span>•</span>
                    <span>Agent: {agent?.name || 'Unassigned'}</span>
                  </div>
                </div>

                {/* Task Execution Action */}
                {task.status === 'pending' ? (
                  <form action={handleCompleteTask} className="flex items-center gap-2 flex-shrink-0">
                    <input type="hidden" name="company_slug" value={slug} />
                    <input type="hidden" name="task_id" value={task.id} />
                    <input
                      type="text"
                      name="outcome"
                      placeholder="Outcome note..."
                      className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-sm"
                    >
                      Done ✓
                    </button>
                  </form>
                ) : (
                  <div className="text-right text-xs">
                    <Badge variant="success">Completed</Badge>
                    {task.outcome && <p className="text-slate-500 text-[11px] mt-1">{task.outcome}</p>}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* New Task Creator Form */}
      <div id="new-task-form" className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
          <Plus className="w-5 h-5 text-brand-600" />
          <span>Create New Follow-up Task</span>
        </h3>

        <form action={handleCreateTask} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <input type="hidden" name="company_slug" value={slug} />

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Task Title *
            </label>
            <input
              type="text"
              name="title"
              required
              placeholder="e.g. Call regarding Shankarpally plot demarcation"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Link to Lead (Optional)
            </label>
            <select
              name="lead_id"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">None / General Task</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.first_name} {l.last_name || ''} ({l.lead_number})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Task Type
            </label>
            <select
              name="task_type"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="call">Phone Call</option>
              <option value="meeting">In-Person Meeting</option>
              <option value="follow_up">General Follow-up</option>
              <option value="site_visit_prep">Site Visit Prep</option>
              <option value="document_collection">Document Collection</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Due Date & Time *
            </label>
            <input
              type="datetime-local"
              name="due_date"
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Assigned Agent
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

          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Description / Notes
            </label>
            <textarea
              name="description"
              rows={2}
              placeholder="Provide context for the follow-up..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-sm transition-all"
            >
              Schedule Follow-up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
