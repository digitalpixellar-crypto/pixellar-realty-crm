import React from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/session';
import { StatCard, formatINR } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Users,
  CreditCard,
  Building2,
  FileSpreadsheet,
} from 'lucide-react';

interface ReportsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function TenantReportsPage({ params }: ReportsPageProps) {
  const { slug } = await params;
  const context = await getTenantContext(slug);
  if (!context) notFound();

  const company = context.company;
  const leads = db.getLeads(company.id);
  const stages = db.getPipelineStages(company.id);
  const bookings = db.getBookings(company.id);
  const payments = db.getCustomerPayments(company.id);
  const visits = db.getSiteVisits(company.id);
  const members = db.getCompanyMembers(company.id);

  // Group Leads by Source
  const sourceCounts: Record<string, number> = {};
  leads.forEach((l) => {
    sourceCounts[l.source] = (sourceCounts[l.source] || 0) + 1;
  });

  // Group Leads by Stage
  const stageCounts = stages.map((s) => ({
    name: s.name,
    color: s.color_hex,
    count: leads.filter((l) => l.stage_id === s.id).length,
  }));

  const totalBookedValue = bookings
    .filter((b) => b.status === 'confirmed')
    .reduce((sum, b) => sum + b.net_sale_amount, 0);

  const totalReconciled = payments
    .filter((p) => p.status === 'reconciled')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalOutstanding = Math.max(0, totalBookedValue - totalReconciled);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Executive Analytics & Reports</h1>
            <Badge variant="primary">Real-Time Telemetry</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Data-driven sales velocity, lead conversion funnels, and revenue reconciliation for {company.name}.
          </p>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          title="Total Booked Sales Value"
          value={formatINR(totalBookedValue)}
          subtitle={`${bookings.length} Confirmed real estate units`}
          icon={<Building2 className="w-5 h-5" />}
          iconBgColor="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          title="Reconciled Bank Collections"
          value={formatINR(totalReconciled)}
          subtitle="Directly cleared into developer accounts"
          icon={<CreditCard className="w-5 h-5" />}
          iconBgColor="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Outstanding Milestone Receivables"
          value={formatINR(totalOutstanding)}
          subtitle="Upcoming construction installments"
          icon={<TrendingUp className="w-5 h-5" />}
          iconBgColor="bg-amber-50 text-amber-600"
        />
      </div>

      {/* Conversion Funnel & Lead Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pipeline Stage Distribution */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-base text-slate-900">Pipeline Conversion Funnel</h3>
            <span className="text-xs text-slate-500 font-medium">Total: {leads.length} Leads</span>
          </div>

          <div className="mt-5 space-y-3">
            {stageCounts.map((stage) => {
              const percentage = leads.length > 0 ? Math.round((stage.count / leads.length) * 100) : 0;

              return (
                <div key={stage.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-700 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                      {stage.name}
                    </span>
                    <span className="text-slate-900">
                      {stage.count} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.max(percentage, 2)}%`,
                        backgroundColor: stage.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lead Sources Distribution */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-base text-slate-900">Lead Acquisition Channels</h3>
            <span className="text-xs text-slate-500 font-medium">Source Attribution</span>
          </div>

          <div className="mt-5 space-y-4">
            {Object.entries(sourceCounts).map(([source, count]) => {
              const percentage = leads.length > 0 ? Math.round((count / leads.length) * 100) : 0;

              return (
                <div key={source} className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-800">{source}</span>
                    <span className="text-xs font-bold text-brand-600">
                      {count} Leads ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                    <div className="h-full bg-brand-600 rounded-full" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sales Agent Productivity Matrix */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="font-bold text-slate-900">Sales Agent Performance Matrix</h3>
          <p className="text-xs text-slate-500">Inbound allocation, site inspections completed, and bookings closed</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Sales Agent</th>
                <th className="px-6 py-3.5">Role / Designation</th>
                <th className="px-6 py-3.5">Assigned Leads</th>
                <th className="px-6 py-3.5">Site Visits Scheduled</th>
                <th className="px-6 py-3.5">Bookings Closed</th>
                <th className="px-6 py-3.5">Closed Value (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members
                .filter((m) => ['sales_manager', 'sales_executive', 'telecaller', 'company_owner'].includes(m.role))
                .map((member) => {
                  const agentLeads = leads.filter((l) => l.assigned_member_id === member.id);
                  const agentVisits = visits.filter((v) => v.assigned_member_id === member.id);
                  const agentBookings = bookings.filter((b) => b.sales_member_id === member.id);
                  const agentValue = agentBookings.reduce((sum, b) => sum + b.net_sale_amount, 0);

                  return (
                    <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">{member.name}</td>
                      <td className="px-6 py-4 text-xs text-slate-500">{member.title || member.role}</td>
                      <td className="px-6 py-4 font-semibold text-slate-800">{agentLeads.length}</td>
                      <td className="px-6 py-4 font-semibold text-slate-800">{agentVisits.length}</td>
                      <td className="px-6 py-4 font-bold text-emerald-700">{agentBookings.length}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">{formatINR(agentValue)}</td>
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
