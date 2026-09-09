import React from 'react';
import { db } from '@/lib/db';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { CreditCard, CheckCircle2, ShieldCheck, RefreshCw } from 'lucide-react';

export default async function PlatformSubscriptionsPage() {
  const subscriptions = db.getCompanies().map((c) => ({
    company: c,
    sub: db.getCompanySubscription(c.id),
    plan: db.getSubscriptionPlans().find((p) => p.id === c.plan_id),
  }));

  const invoices = db.getSubscriptionInvoices();

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="border-b border-slate-800 pb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">SaaS Subscriptions & Billing</h1>
        <p className="text-sm text-slate-400 mt-1">
          Razorpay recurring subscription contracts, auto-debits, collected SaaS revenue, and invoices.
        </p>
      </div>

      {/* Subscriptions List */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">Active Subscription Contracts</h3>
            <p className="text-xs text-slate-400">Current billing periods and Razorpay subscription IDs</p>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Razorpay Webhooks Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/60 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Company</th>
                <th className="px-6 py-3.5">Plan Tier</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Cycle</th>
                <th className="px-6 py-3.5">Current Period</th>
                <th className="px-6 py-3.5">Razorpay Sub ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {subscriptions.map(({ company, sub, plan }) => (
                <tr key={company.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-white">{company.name}</td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-slate-200">{plan?.name}</span>
                    <span className="text-xs text-slate-400 block">
                      ₹{plan?.monthly_price_inr.toLocaleString('en-IN')}/mo
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={sub?.status || company.status} />
                  </td>
                  <td className="px-6 py-4 capitalize text-slate-300">
                    {sub?.billing_cycle || 'monthly'}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-400">
                    {sub?.current_period_start
                      ? `${new Date(sub.current_period_start).toLocaleDateString('en-IN')} - ${new Date(
                          sub.current_period_end
                        ).toLocaleDateString('en-IN')}`
                      : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-slate-400">
                    {sub?.razorpay_subscription_id || 'Trial Period'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoices Ledger */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-800">
          <h3 className="text-base font-semibold text-white">SaaS Payment Invoices ({invoices.length})</h3>
          <p className="text-xs text-slate-400">Verified Razorpay charges for Digital Pixellar subscription fees</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/60 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Invoice #</th>
                <th className="px-6 py-3.5">Company</th>
                <th className="px-6 py-3.5">Amount (INR)</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Payment ID</th>
                <th className="px-6 py-3.5">Paid At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {invoices.map((inv) => {
                const comp = db.getCompany(inv.company_id);
                return (
                  <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-white">{inv.invoice_number}</td>
                    <td className="px-6 py-4 font-medium text-slate-200">{comp?.name || 'Company'}</td>
                    <td className="px-6 py-4 font-bold text-emerald-400">
                      ₹{inv.amount_inr.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="success">PAID</Badge>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">
                      {inv.razorpay_payment_id || 'Mock Checkout'}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {inv.paid_at ? new Date(inv.paid_at).toLocaleString('en-IN') : 'N/A'}
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
