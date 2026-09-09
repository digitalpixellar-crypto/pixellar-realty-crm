'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import {
  ShieldCheck,
  LayoutDashboard,
  Building2,
  PackageCheck,
  CreditCard,
  FileText,
  Activity,
  ArrowLeft,
} from 'lucide-react';

export function PlatformSidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Platform Overview', href: '/platform/dashboard', icon: LayoutDashboard },
    { name: 'Companies & Tenants', href: '/platform/companies', icon: Building2 },
    { name: 'Subscription Plans', href: '/platform/plans', icon: PackageCheck },
    { name: 'Billing & Invoices', href: '/platform/subscriptions', icon: CreditCard },
    { name: 'Platform Audit Logs', href: '/platform/audit-logs', icon: FileText },
    { name: 'System Health', href: '/platform/health', icon: Activity },
  ];

  return (
    <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col flex-shrink-0 min-h-screen border-r border-slate-800">
      {/* Superadmin Header */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-800 bg-slate-900/60">
        <div className="h-9 w-9 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold shadow-sm">
          <ShieldCheck className="w-5 h-5 text-amber-400" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-bold text-white tracking-tight">PLATFORM OWNER</span>
          <span className="text-[10px] uppercase font-semibold text-amber-400 tracking-wider">Superadmin Console</span>
        </div>
      </div>

      {/* Owner Badge */}
      <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-900/30">
        <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Owner & Administrator</div>
        <div className="text-xs font-bold text-white truncate mt-0.5">K. Yeswanth Kumar Reddy</div>
        <div className="text-[11px] text-slate-400 truncate">Digital Pixellar</div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
              )}
            >
              <Icon className={clsx('w-4 h-4 flex-shrink-0', isActive ? 'text-slate-950' : 'text-slate-400')} />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Return to Tenant App */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/40">
        <Link
          href="/app/skyline-developers/dashboard"
          className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Switch to Tenant Workspace</span>
        </Link>
      </div>
    </aside>
  );
}
