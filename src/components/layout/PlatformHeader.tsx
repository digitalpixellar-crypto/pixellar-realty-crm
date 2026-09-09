'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowUpRight, LogOut } from 'lucide-react';

export function PlatformHeader() {
  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm text-white">
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          SaaS Multi-Tenant Core: Online
        </span>
        <span className="text-xs text-slate-400">Database RLS Active • Razorpay Test Mode Ready</span>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/app/skyline-developers/dashboard"
          className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
        >
          <span>View Sample Tenant</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>

        <Link
          href="/"
          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          title="Exit to home"
        >
          <LogOut className="w-4 h-4" />
        </Link>
      </div>
    </header>
  );
}
