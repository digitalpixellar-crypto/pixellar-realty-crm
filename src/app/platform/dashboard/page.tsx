import React from 'react';
import { db } from '@/lib/db';
import { StatCard, formatINR } from '@/components/ui/StatCard';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { Building2, CreditCard, Users, TrendingUp, ShieldAlert, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default async function PlatformDashboardPage() {
  const metrics = db.getPlatformMetrics();
  const companies = db.getCompanies();
  const plans = db.getSubscriptionPlans();
  const invoices = db.getSubscriptionInvoices();

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Platform Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Platform Owner Administration</h1>
            <Badge variant="purple">Superadmin</Badge>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Executive oversight for Digital Pixellar. Managed by <span className="text-white font-medium">K. Yeswanth Kumar Reddy</span>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/platform/companies"
            className="px-4 py-2 text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-sm transition-colors"
          >
            + Onboard New Company
          </Link>
          <Link
            href="/platform/plans"
            className="px-4 py-2 text-sm font-medium bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 transition-colors"
          >
            Manage Plans
          </Link>
        </div>
      </div>

      {/* SaaS Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Active SaaS MRR"
          value={formatINR(metrics.monthlyRecurringRevenue)}
          subtitle="Monthly Recurring Subscription Revenue"
          icon={<CreditCard className="w-5 h-5" />}
          iconBgColor="bg-emerald-500/10 text-emerald-400"
          className="bg-slate-900 border-slate-800 text-white"
        />
        <StatCard
          title="SaaS Projected ARR"
          value={formatINR(metrics.annualRecurringRevenue)}
          subtitle="Annual Recurring Revenue run rate"
          icon={<TrendingUp className="w-5 h-5" />}
          iconBgColor="bg-blue-500/10 text-blue-400"
          className="bg-slate-900 border-slate-800 text-white"
        />
        <StatCard
          title="Subscribing Companies"
          value={metrics.totalCompanies}
          subtitle={`${metrics.activeCompanies} Active • ${metrics.trialCompanies} in Free Trial`}
          icon={<Building2 className="w-5 h-5" />}
          iconBgColor="bg-amber-500/10 text-amber-400"
          className="bg-slate-900 border-slate-800 text-white"
        />
        <StatCard
          title="Platform Users"
          value={metrics.totalUsersPlatformWide}
          subtitle={`${metrics.totalLeadsCapturedPlatformWide} total leads processed`}
          icon={<Users className="w-5 h-5" />}
          iconBgColor="bg-purple-500/10 text-purple-400"
          className="bg-slate-900 border-slate-800 text-white"
        />
      </div>

      {/* Architecture & Isolation Notice Banner */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 flex items-start gap-4">
        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 flex-shrink-0">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div className="text-sm">
          <h4 className="font-semibold text-white">Strict Tenant Isolation & Data Privacy Verified</h4>
          <p className="text-slate-400 mt-1 leading-relaxed">
            Platform Owner oversight encompasses company accounts, subscription status, plan quotas, and SaaS billing records.
            Tenant customer CRM data (buyer identities, notes, private financials) is strictly isolated under PostgreSQL Row-Level Security.
            Platform support access requires explicit, audited, time-limited tenant authorization.
          </p>
        </div>
      </div>

      {/* Subscribing Companies Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">Subscribed Real Estate Companies</h3>
            <p className="text-xs text-slate-400 mt-0.5">Active workspaces and current subscription tiers</p>
          </div>
          <Link href="/platform/companies" className="text-xs font-medium text-amber-400 hover:underline">
            View All ({companies.length}) →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/60 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Company Name</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Plan Tier</th>
                <th className="px-6 py-3.5">City / Region</th>
                <th className="px-6 py-3.5">Members</th>
                <th className="px-6 py-3.5">Onboarded</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {companies.map((company) => {
                const plan = plans.find((p) => p.id === company.plan_id);
                const membersCount = db.getCompanyMembers(company.id).length;

                return (
                  <tr key={company.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{company.name}</div>
                      <div className="text-xs text-slate-400">{company.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={company.status} />
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-200">{plan?.name || 'Standard'}</span>
                      <span className="text-xs text-slate-400 block">
                        {plan ? `₹${plan.monthly_price_inr.toLocaleString('en-IN')}/mo` : ''}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {company.city}, {company.state}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-white">{membersCount}</span>
                      <span className="text-slate-500 text-xs"> / {plan?.max_users || 5} seats</span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {new Date(company.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/app/${company.slug}/dashboard`}
                        className="text-xs font-semibold text-brand-400 hover:text-brand-300 hover:underline"
                      >
                        Open Workspace →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subscription Plans & Billing Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Plans */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-semibold text-white">Subscription Plans</h3>
              <p className="text-xs text-slate-400">Configured pricing tiers for real estate firms</p>
            </div>
            <Link href="/platform/plans" className="text-xs font-medium text-amber-400 hover:underline">
              Edit Plans →
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="flex items-center justify-between p-3.5 rounded-lg bg-slate-950/40 border border-slate-800/80"
              >
                <div>
                  <div className="font-semibold text-white">{plan.name} Plan</div>
                  <div className="text-xs text-slate-400">
                    Max {plan.max_users} users • {plan.max_projects} projects • {plan.max_leads_per_month} leads/mo
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-amber-400">
                    ₹{plan.monthly_price_inr.toLocaleString('en-IN')}
                    <span className="text-xs font-normal text-slate-400">/mo</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Annual: ₹{plan.annual_price_inr.toLocaleString('en-IN')}/yr
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent SaaS Billing Invoices */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-semibold text-white">Recent SaaS Billing Events</h3>
              <p className="text-xs text-slate-400">Razorpay subscription charges & revenue ledger</p>
            </div>
            <Link href="/platform/subscriptions" className="text-xs font-medium text-amber-400 hover:underline">
              All Invoices →
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {invoices.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">No billing transactions recorded yet.</p>
            ) : (
              invoices.map((inv) => {
                const comp = companies.find((c) => c.id === inv.company_id);
                return (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between p-3.5 rounded-lg bg-slate-950/40 border border-slate-800/80"
                  >
                    <div>
                      <div className="font-semibold text-white">{comp?.name || 'Company'}</div>
                      <div className="text-xs text-slate-400">
                        {inv.invoice_number} • {new Date(inv.created_at).toLocaleDateString('en-IN')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-emerald-400">
                        +₹{inv.amount_inr.toLocaleString('en-IN')}
                      </div>
                      <Badge variant="success" size="sm">
                        {inv.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
