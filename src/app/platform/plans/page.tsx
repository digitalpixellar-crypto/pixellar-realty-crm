import React from 'react';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { Check, ShieldCheck } from 'lucide-react';

async function handleUpdatePlan(formData: FormData) {
  'use server';
  const planId = formData.get('plan_id') as string;
  const monthlyPrice = parseFloat(formData.get('monthly_price_inr') as string);
  const annualPrice = parseFloat(formData.get('annual_price_inr') as string);
  const maxUsers = parseInt(formData.get('max_users') as string, 10);
  const maxProjects = parseInt(formData.get('max_projects') as string, 10);
  const maxLeads = parseInt(formData.get('max_leads_per_month') as string, 10);

  if (!planId) return;

  db.updateSubscriptionPlan(planId, {
    monthly_price_inr: monthlyPrice,
    annual_price_inr: annualPrice,
    max_users: maxUsers,
    max_projects: maxProjects,
    max_leads_per_month: maxLeads,
  });

  revalidatePath('/platform/plans');
  revalidatePath('/platform/dashboard');
}

export default async function PlatformPlansPage() {
  const plans = db.getSubscriptionPlans();

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="border-b border-slate-800 pb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">SaaS Subscription Plans & Pricing</h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure tiers, pricing in INR, user limits, and feature entitlements for Pixellar Realty CRM.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="rounded-xl border border-slate-800 bg-slate-900 flex flex-col justify-between overflow-hidden shadow-sm"
          >
            <div className="p-6 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {plan.slug}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-2 min-h-[36px]">{plan.description}</p>

              <form action={handleUpdatePlan} className="mt-5 space-y-3">
                <input type="hidden" name="plan_id" value={plan.id} />

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Monthly Price (₹)
                  </label>
                  <input
                    type="number"
                    name="monthly_price_inr"
                    defaultValue={plan.monthly_price_inr}
                    step="1"
                    className="w-full px-2.5 py-1.5 text-sm bg-slate-950 border border-slate-800 rounded text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Annual Price (₹)
                  </label>
                  <input
                    type="number"
                    name="annual_price_inr"
                    defaultValue={plan.annual_price_inr}
                    step="1"
                    className="w-full px-2.5 py-1.5 text-sm bg-slate-950 border border-slate-800 rounded text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Seats
                    </label>
                    <input
                      type="number"
                      name="max_users"
                      defaultValue={plan.max_users}
                      className="w-full px-2 py-1 text-xs bg-slate-950 border border-slate-800 rounded text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Projects
                    </label>
                    <input
                      type="number"
                      name="max_projects"
                      defaultValue={plan.max_projects}
                      className="w-full px-2 py-1 text-xs bg-slate-950 border border-slate-800 rounded text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Leads/mo
                    </label>
                    <input
                      type="number"
                      name="max_leads_per_month"
                      defaultValue={plan.max_leads_per_month}
                      className="w-full px-2 py-1 text-xs bg-slate-950 border border-slate-800 rounded text-white focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-1.5 px-3 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors mt-2"
                >
                  Save Limits & Pricing
                </button>
              </form>
            </div>

            {/* Feature Entitlements Checklist */}
            <div className="p-6 bg-slate-950/40 text-xs space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                Entitlements
              </span>
              <div className="flex items-center gap-2 text-slate-300">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Anti-Double-Booking Engine</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Site Visits & Tasks</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                {plan.features.round_robin_allocation ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <span className="w-3.5 h-3.5 text-slate-600 font-bold">✕</span>
                )}
                <span>Round-Robin Lead Routing</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                {plan.features.channel_partners ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <span className="w-3.5 h-3.5 text-slate-600 font-bold">✕</span>
                )}
                <span>Channel Partner Commissions</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                {plan.features.webhooks_api ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <span className="w-3.5 h-3.5 text-slate-600 font-bold">✕</span>
                )}
                <span>Inbound Lead Webhooks API</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
