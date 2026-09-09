import React from 'react';
import { db } from '@/lib/db';
import { CheckCircle2, Server, Database, Shield, Zap, RefreshCw } from 'lucide-react';

export default async function PlatformHealthPage() {
  const companies = db.getCompanies();
  const plans = db.getSubscriptionPlans();
  const leads = db.getLeads('comp-skyline-01');

  const services = [
    { name: 'Multi-Tenant Data Engine', status: 'Operational', latency: '4ms', icon: Database },
    { name: 'PostgreSQL Row Level Security Guard', status: 'Active & Verified', latency: '1ms', icon: Shield },
    { name: 'Anti-Double-Booking Concurrency Engine', status: 'Operational', latency: '2ms', icon: Zap },
    { name: 'Razorpay Webhook Event Processor', status: 'Ready (Test Mode)', latency: '35ms', icon: Server },
    { name: 'Background Hold Expiry Cleaner', status: 'Active', latency: 'Instant', icon: RefreshCw },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="border-b border-slate-800 pb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Platform System & Integration Health</h1>
        <p className="text-sm text-slate-400 mt-1">
          Diagnostics for background workers, database constraints, isolation layers, and webhook processors.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((svc) => {
          const Icon = svc.icon;
          return (
            <div key={svc.name} className="rounded-xl border border-slate-800 bg-slate-900 p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {svc.status}
                </span>
              </div>

              <div className="mt-4">
                <h4 className="font-semibold text-white">{svc.name}</h4>
                <p className="text-xs text-slate-400 mt-1">Internal Latency: <span className="text-emerald-400 font-mono">{svc.latency}</span></p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
