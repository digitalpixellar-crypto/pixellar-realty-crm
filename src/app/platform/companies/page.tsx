import React from 'react';
import { db } from '@/lib/db';
import { StatusBadge } from '@/components/ui/Badge';
import { Building2, Plus, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';

async function handleCreateCompany(formData: FormData) {
  'use server';
  const name = formData.get('name') as string;
  const slug = formData.get('slug') as string;
  const email = formData.get('email') as string;
  const phone = formData.get('phone') as string;
  const city = formData.get('city') as string;
  const state = formData.get('state') as string;
  const planId = formData.get('plan_id') as string;

  if (!name || !slug || !email) return;

  const newCompany = db.createCompany({
    name,
    slug,
    email,
    phone,
    city,
    state,
    plan_id: planId || 'plan-growth-02',
    status: 'trial',
  });

  // Create initial owner member for this company
  db.createMember({
    company_id: newCompany.id,
    user_id: `usr-${Date.now()}`,
    role: 'company_owner',
    name: `${name} Administrator`,
    email: email,
    phone: phone,
    title: 'Managing Director & Owner',
    is_active: true,
  });

  revalidatePath('/platform/companies');
  revalidatePath('/platform/dashboard');
}

async function handleToggleStatus(formData: FormData) {
  'use server';
  const companyId = formData.get('company_id') as string;
  const currentStatus = formData.get('current_status') as string;

  const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
  db.updateCompany(companyId, { status: newStatus as any });

  revalidatePath('/platform/companies');
  revalidatePath('/platform/dashboard');
}

export default async function PlatformCompaniesPage() {
  const companies = db.getCompanies();
  const plans = db.getSubscriptionPlans();

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Subscribing Companies & Workspaces</h1>
          <p className="text-sm text-slate-400 mt-1">
            Provision, manage, suspend, and configure real estate client workspaces.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Onboard Company Form */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6 h-fit">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
            <Plus className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-semibold text-white">Onboard New Company</h3>
          </div>

          <form action={handleCreateCompany} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Company Name *
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="e.g. Prestige Living LLP"
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Workspace URL Slug *
              </label>
              <div className="flex items-center">
                <span className="px-2.5 py-2 text-xs text-slate-500 bg-slate-800 rounded-l-lg border border-r-0 border-slate-700">
                  /app/
                </span>
                <input
                  type="text"
                  name="slug"
                  required
                  placeholder="prestige-living"
                  className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-r-lg text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Official Email *
              </label>
              <input
                type="email"
                name="email"
                required
                placeholder="director@prestigeliving.com"
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <input
                type="text"
                name="phone"
                placeholder="+91 98765 11223"
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  placeholder="Hyderabad"
                  className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">State</label>
                <input
                  type="text"
                  name="state"
                  placeholder="Telangana"
                  className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Initial Plan Tier
              </label>
              <select
                name="plan_id"
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-amber-400"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (₹{p.monthly_price_inr.toLocaleString('en-IN')}/mo)
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm transition-colors shadow-sm mt-2"
            >
              Create Company & Provision Workspace
            </button>
          </form>
        </div>

        {/* Existing Companies List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800">
              <h3 className="text-base font-semibold text-white">Active Tenants ({companies.length})</h3>
            </div>

            <div className="divide-y divide-slate-800">
              {companies.map((company) => {
                const plan = plans.find((p) => p.id === company.plan_id);
                const members = db.getCompanyMembers(company.id);

                return (
                  <div key={company.id} className="p-6 hover:bg-slate-800/20 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className="text-lg font-bold text-white">{company.name}</h4>
                          <StatusBadge status={company.status} />
                        </div>
                        <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-4">
                          <span>Slug: <code className="text-slate-300">/app/{company.slug}</code></span>
                          <span>Email: {company.email}</span>
                          <span>City: {company.city || 'N/A'}, {company.state || 'India'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/app/${company.slug}/dashboard`}
                          className="px-3 py-1.5 text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white rounded-lg transition-colors flex items-center gap-1"
                        >
                          <span>Open</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>

                        <form action={handleToggleStatus}>
                          <input type="hidden" name="company_id" value={company.id} />
                          <input type="hidden" name="current_status" value={company.status} />
                          <button
                            type="submit"
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                              company.status === 'active'
                                ? 'border-rose-800 text-rose-400 hover:bg-rose-950/40'
                                : 'border-emerald-800 text-emerald-400 hover:bg-emerald-950/40'
                            }`}
                          >
                            {company.status === 'active' ? 'Suspend' : 'Reactivate'}
                          </button>
                        </form>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-800/60 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-slate-500 block">Subscription Tier</span>
                        <span className="font-semibold text-slate-200">{plan?.name || 'Standard'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Seat Utilization</span>
                        <span className="font-semibold text-slate-200">
                          {members.length} / {plan?.max_users || 5} Users
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Timezone</span>
                        <span className="font-semibold text-slate-200">{company.timezone}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Onboarded Date</span>
                        <span className="font-semibold text-slate-200">
                          {new Date(company.created_at).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
