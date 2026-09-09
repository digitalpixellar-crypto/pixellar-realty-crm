import React from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/session';
import { StatCard, formatINR } from '@/components/ui/StatCard';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import {
  Users,
  CalendarCheck,
  Compass,
  FileCheck2,
  CreditCard,
  Building2,
  Clock,
  PhoneCall,
  Plus,
  ArrowRight,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

interface DashboardPageProps {
  params: Promise<{ slug: string }>;
}

export default async function TenantDashboardPage({ params }: DashboardPageProps) {
  const { slug } = await params;
  const context = await getTenantContext(slug);
  if (!context) notFound();

  const company = context.company;
  const leads = db.getLeads(company.id);
  const tasks = db.getTasks(company.id);
  const visits = db.getSiteVisits(company.id);
  const units = db.getUnits(company.id);
  const bookings = db.getBookings(company.id);
  const payments = db.getCustomerPayments(company.id);

  // Calculate Metrics
  const totalLeads = leads.length;
  const hotLeads = leads.filter((l) => l.temperature === 'hot').length;

  const now = new Date();
  const todayTasks = tasks.filter((t) => {
    const d = new Date(t.due_date);
    return d.toDateString() === now.toDateString() && t.status === 'pending';
  });
  const overdueTasks = tasks.filter((t) => new Date(t.due_date) < now && t.status === 'pending');

  const scheduledVisits = visits.filter((v) => v.status === 'scheduled' || v.status === 'confirmed');

  const totalBookedValue = bookings
    .filter((b) => b.status === 'confirmed')
    .reduce((sum, b) => sum + b.net_sale_amount, 0);

  const totalCollections = payments
    .filter((p) => p.status === 'reconciled')
    .reduce((sum, p) => sum + p.amount, 0);

  // Unit inventory breakdown
  const availableUnits = units.filter((u) => u.status === 'available').length;
  const onHoldUnits = units.filter((u) => u.status === 'on_hold').length;
  const bookedUnits = units.filter((u) => u.status === 'booked' || u.status === 'sold').length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{company.name}</h1>
            <Badge variant="primary">Workspace Active</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time CRM command center. Logged in as <span className="font-semibold text-slate-700">{context.member.name}</span> ({context.role}).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href={`/app/${slug}/leads?action=new`}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Lead</span>
          </Link>
          <Link
            href={`/app/${slug}/inventory`}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-sm shadow-sm transition-colors"
          >
            <Building2 className="w-4 h-4 text-brand-600" />
            <span>Lock / Hold Unit</span>
          </Link>
          <Link
            href={`/app/${slug}/site-visits?action=new`}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-sm shadow-sm transition-colors"
          >
            <Compass className="w-4 h-4 text-brand-600" />
            <span>Schedule Visit</span>
          </Link>
        </div>
      </div>

      {/* Overdue Task Alert if present */}
      {overdueTasks.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-800">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                {overdueTasks.length} Follow-up {overdueTasks.length === 1 ? 'task is' : 'tasks are'} overdue!
              </h4>
              <p className="text-xs text-amber-700 mt-0.5">
                Immediate customer contact required to prevent lead leakage.
              </p>
            </div>
          </div>
          <Link
            href={`/app/${slug}/follow-ups`}
            className="text-xs font-bold text-amber-900 bg-amber-200/80 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            Review Agenda →
          </Link>
        </div>
      )}

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Pipeline Leads"
          value={totalLeads}
          subtitle={`${hotLeads} Hot Leads ready for closing`}
          icon={<Users className="w-5 h-5" />}
          iconBgColor="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Today's Follow-ups"
          value={todayTasks.length}
          subtitle={`${overdueTasks.length} Overdue tasks`}
          icon={<CalendarCheck className="w-5 h-5" />}
          iconBgColor="bg-amber-50 text-amber-600"
        />
        <StatCard
          title="Booked Sales Value"
          value={formatINR(totalBookedValue)}
          subtitle={`${bookings.length} Property units booked`}
          icon={<FileCheck2 className="w-5 h-5" />}
          iconBgColor="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          title="Payments Reconciled"
          value={formatINR(totalCollections)}
          subtitle="Cleared bank collections"
          icon={<CreditCard className="w-5 h-5" />}
          iconBgColor="bg-emerald-50 text-emerald-600"
        />
      </div>

      {/* Middle Section: Inventory Status & Pipeline Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inventory Tracker Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">Inventory Status</h3>
              <Link href={`/app/${slug}/inventory`} className="text-xs font-semibold text-brand-600 hover:underline">
                View All Units ({units.length}) →
              </Link>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-100">
                <span className="text-2xl font-bold text-emerald-700">{availableUnits}</span>
                <span className="block text-xs font-semibold text-emerald-800 mt-1">Available</span>
              </div>
              <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-100">
                <span className="text-2xl font-bold text-amber-700">{onHoldUnits}</span>
                <span className="block text-xs font-semibold text-amber-800 mt-1">On Hold (48h)</span>
              </div>
              <div className="p-3.5 rounded-lg bg-indigo-50 border border-indigo-100">
                <span className="text-2xl font-bold text-indigo-700">{bookedUnits}</span>
                <span className="block text-xs font-semibold text-indigo-800 mt-1">Booked / Sold</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 mt-4 leading-relaxed">
              Real-time anti-double-booking locks are active. Expired holds automatically release back to Available inventory.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <Link
              href={`/app/${slug}/inventory`}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
            >
              <span>Explore Plot & Apartment Matrix</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Site Visits Upcoming */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">Scheduled Site Visits</h3>
              <Link href={`/app/${slug}/site-visits`} className="text-xs font-semibold text-brand-600 hover:underline">
                Visits Calendar →
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {scheduledVisits.length === 0 ? (
                <p className="text-sm text-slate-500 py-6 text-center">No upcoming visits scheduled.</p>
              ) : (
                scheduledVisits.slice(0, 3).map((visit) => {
                  const lead = leads.find((l) => l.id === visit.lead_id);
                  const project = db.getProject(company.id, visit.project_id);

                  return (
                    <div key={visit.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-sm text-slate-900">{lead ? `${lead.first_name} ${lead.last_name || ''}` : 'Lead'}</div>
                        <div className="text-xs text-slate-500">{project?.name || 'Project'}</div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          📅 {new Date(visit.scheduled_at).toLocaleString('en-IN', { timeZone: company.timezone })}
                        </div>
                      </div>
                      <StatusBadge status={visit.status} />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <Link
              href={`/app/${slug}/site-visits`}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
            >
              <span>Manage All Site Visits</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Pipeline Stages Quick Glance */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">Pipeline Kanban</h3>
              <Link href={`/app/${slug}/leads/kanban`} className="text-xs font-semibold text-brand-600 hover:underline">
                Open Kanban Board →
              </Link>
            </div>

            <div className="mt-4 space-y-2">
              {db.getPipelineStages(company.id).slice(0, 5).map((stage) => {
                const count = leads.filter((l) => l.stage_id === stage.id).length;
                return (
                  <div key={stage.id} className="flex items-center justify-between py-1.5 text-xs">
                    <span className="font-medium text-slate-700 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color_hex }} />
                      {stage.name}
                    </span>
                    <span className="font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <Link
              href={`/app/${slug}/leads/kanban`}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-semibold transition-colors"
            >
              <span>Open Visual Pipeline Board</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Leads Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900">Recent Inbound Leads</h3>
            <p className="text-xs text-slate-500">Newly captured prospect inquiries</p>
          </div>
          <Link href={`/app/${slug}/leads`} className="text-xs font-semibold text-brand-600 hover:underline">
            View All ({leads.length}) →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Lead #</th>
                <th className="px-6 py-3.5">Name</th>
                <th className="px-6 py-3.5">Phone</th>
                <th className="px-6 py-3.5">Interested Project</th>
                <th className="px-6 py-3.5">Stage</th>
                <th className="px-6 py-3.5">Priority</th>
                <th className="px-6 py-3.5">Created</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.slice(0, 5).map((lead) => {
                const project = db.getProject(company.id, lead.interested_project_id || '');
                const stage = db.getPipelineStages(company.id).find((s) => s.id === lead.stage_id);

                return (
                  <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-600">{lead.lead_number}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {lead.first_name} {lead.last_name || ''}
                      {lead.is_duplicate && (
                        <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          Duplicate
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">
                      <a href={`tel:${lead.phone}`} className="text-brand-600 hover:underline flex items-center gap-1">
                        <PhoneCall className="w-3 h-3" />
                        {lead.phone}
                      </a>
                    </td>
                    <td className="px-6 py-4 text-xs">{project?.name || 'Any'}</td>
                    <td className="px-6 py-4">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ backgroundColor: `${stage?.color_hex || '#3B82F6'}15`, color: stage?.color_hex || '#3B82F6' }}
                      >
                        {stage?.name || 'New'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={lead.priority} />
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(lead.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/app/${slug}/leads/${lead.id}`}
                        className="text-xs font-semibold text-brand-600 hover:text-brand-800 hover:underline"
                      >
                        Open Profile →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
