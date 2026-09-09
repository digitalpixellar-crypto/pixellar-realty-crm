import React from 'react';
import Link from 'next/link';
import {
  Building,
  ShieldCheck,
  Zap,
  Users,
  CreditCard,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  Compass,
  FileCheck2,
  Boxes,
} from 'lucide-react';
import { db } from '@/lib/db';
import { formatINR } from '@/components/ui/StatCard';

export default function LandingPage() {
  const plans = db.getSubscriptionPlans();
  const companies = db.getCompanies();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-brand-500 selection:text-white">
      {/* Navigation */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-brand-500/20">
              <Building className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white block leading-tight">
                PIXELLAR REALTY CRM
              </span>
              <span className="text-[10px] uppercase font-semibold text-brand-400 tracking-wider">
                By Digital Pixellar
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">
              Platform Features
            </a>
            <a href="#architecture" className="hover:text-white transition-colors">
              Data Isolation
            </a>
            <a href="#pricing" className="hover:text-white transition-colors">
              SaaS Pricing
            </a>
            <a href="#workspaces" className="hover:text-white transition-colors">
              Demo Workspaces
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/platform/dashboard"
              className="px-3.5 py-1.5 rounded-lg border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 text-xs font-semibold transition-colors"
            >
              Platform Owner
            </Link>
            <Link
              href="/app/skyline-developers/dashboard"
              className="px-4 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-sm transition-all"
            >
              Launch Workspace →
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-6 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-300 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Generation Multi-Tenant Real Estate CRM Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none">
          Enterprise Real Estate CRM SaaS Built for Scale.
        </h1>

        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mt-6 leading-relaxed">
          Full multi-tenant data isolation with PostgreSQL Row-Level Security, anti-double-booking concurrency locks, milestone payment schedules, and channel partner commission settlement.
        </p>

        {/* Ownership Credit */}
        <div className="mt-4 text-xs text-slate-500">
          Product Owner: <strong className="text-slate-300">K. Yeswanth Kumar Reddy</strong> • Digital Pixellar
        </div>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/app/skyline-developers/dashboard"
            className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm shadow-lg shadow-brand-600/30 transition-all flex items-center gap-2"
          >
            <span>Open Skyline Developers (Tenant A)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/app/greenfield-estates/dashboard"
            className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm shadow-sm transition-all"
          >
            Open Greenfield Estates (Tenant B)
          </Link>
          <Link
            href="/platform/dashboard"
            className="px-6 py-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold text-sm transition-all"
          >
            Platform Owner Console
          </Link>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section id="features" className="py-20 border-t border-slate-800 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-white tracking-tight">
              Engineered for High-Velocity Property Sales
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              From inbound campaign capture to possession handover and broker commissions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-white">Anti-Double-Booking Concurrency</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Database-level optimistic row locking and unique constraints prevent two simultaneous sales agents from reserving or selling the same plot or apartment.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="w-10 h-10 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center mb-4">
                <Boxes className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-white">Interactive Property Matrix</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Color-coded visual layout grid for Villa plots, High-rise apartments, and farmland plots with automated 48-hour expiring hold releases.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-white">Strict PostgreSQL RLS Isolation</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Row-Level Security enforces zero cross-tenant leakage. Company A cannot read or mutate Company B&apos;s leads, pricing, or buyer identities under direct API requests.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-white">Razorpay Recurring Billing</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Automated recurring subscription billing with HMAC SHA-256 signature verification and idempotent webhook ledger preventing duplicate entitlement activation.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-white">Field Site Visits & Transportation</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Coordinate customer site inspections, cab pickup requirements, customer objections, and post-visit conversion probabilities.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-white">Milestone Schedules & Broker Ledger</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Construction-linked installment tracking, buyer payment reconciliation, and snapshotted channel partner commission rules.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SaaS Pricing Plans */}
      <section id="pricing" className="py-20 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-white tracking-tight">
              Predictable SaaS Subscription Plans
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Sold and administered directly by Digital Pixellar. Configurable by Platform Owner.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between"
              >
                <div>
                  <h3 className="font-bold text-lg text-white">{plan.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 min-h-[32px]">{plan.description}</p>
                  <div className="text-2xl font-bold text-white mt-4">
                    ₹{plan.monthly_price_inr.toLocaleString('en-IN')}
                    <span className="text-xs text-slate-400 font-normal"> / month</span>
                  </div>

                  <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>Max {plan.max_users} User Seats</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>{plan.max_projects} Real Estate Projects</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>{plan.max_leads_per_month.toLocaleString('en-IN')} Inbound Leads/mo</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>Anti-Double-Booking Guard</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-800">
                  <Link
                    href={`/app/skyline-developers/dashboard`}
                    className="w-full block py-2 text-center rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
                  >
                    Start Free 14-Day Trial
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12 px-6 bg-slate-950 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-bold text-slate-300">PIXELLAR REALTY CRM</span> by Digital Pixellar.
            <span className="block mt-0.5">Product Owner: K. Yeswanth Kumar Reddy</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/platform/dashboard" className="hover:text-slate-300 transition-colors">
              Platform Admin
            </Link>
            <Link href="/app/skyline-developers/dashboard" className="hover:text-slate-300 transition-colors">
              Skyline Workspace
            </Link>
            <Link href="/app/greenfield-estates/dashboard" className="hover:text-slate-300 transition-colors">
              Greenfield Workspace
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
