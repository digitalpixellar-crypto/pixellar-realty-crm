'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import {
  LayoutDashboard,
  Users,
  KanbanSquare,
  CalendarCheck,
  Building2,
  Boxes,
  Compass,
  FileCheck2,
  CreditCard,
  Handshake,
  BarChart3,
  Webhook,
  Settings,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { Company, CompanyMember } from '@/types';
import { ROLE_LABELS } from '@/lib/auth/permissions';

interface AppSidebarProps {
  company: Company;
  member: CompanyMember;
}

export function AppSidebar({ company, member }: AppSidebarProps) {
  const pathname = usePathname();
  const slug = company.slug;

  const navItems = [
    { name: 'Dashboard', href: `/app/${slug}/dashboard`, icon: LayoutDashboard },
    { name: 'Leads', href: `/app/${slug}/leads`, icon: Users },
    { name: 'Pipeline Kanban', href: `/app/${slug}/leads/kanban`, icon: KanbanSquare },
    { name: 'Follow-ups & Agenda', href: `/app/${slug}/follow-ups`, icon: CalendarCheck },
    { name: 'Projects', href: `/app/${slug}/projects`, icon: Building2 },
    { name: 'Property Inventory', href: `/app/${slug}/inventory`, icon: Boxes },
    { name: 'Site Visits', href: `/app/${slug}/site-visits`, icon: Compass },
    { name: 'Bookings', href: `/app/${slug}/bookings`, icon: FileCheck2 },
    { name: 'Payments & Ledger', href: `/app/${slug}/payments`, icon: CreditCard },
    { name: 'Channel Partners', href: `/app/${slug}/channel-partners`, icon: Handshake },
    { name: 'Reports & Analytics', href: `/app/${slug}/reports`, icon: BarChart3 },
    { name: 'Integrations', href: `/app/${slug}/integrations`, icon: Webhook },
    { name: 'Settings & Team', href: `/app/${slug}/settings`, icon: Settings },
  ];

  return (
    <aside className="hidden md:flex w-64 bg-slate-900 text-slate-300 flex-col flex-shrink-0 min-h-screen border-r border-slate-800">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-800 bg-slate-950/40">
        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-brand-500 to-indigo-700 flex items-center justify-center text-white font-bold shadow-md shadow-brand-500/20">
          <Building className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-bold text-white truncate tracking-tight">PIXELLAR REALTY</span>
          <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">CRM by Digital Pixellar</span>
        </div>
      </div>

      {/* Workspace Context Card */}
      <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-950/20">
        <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">Workspace</div>
        <div className="text-sm font-semibold text-white truncate mt-0.5">{company.name}</div>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-brand-500/20 text-brand-300 border border-brand-500/30">
            {company.status === 'trial' ? 'Free Trial' : 'Active Subscription'}
          </span>
          <span className="text-[11px] text-slate-400">{company.currency}</span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href.includes('/leads') && item.href !== `/app/${slug}/leads/kanban` && pathname.startsWith(item.href) && !pathname.includes('kanban'));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              )}
            >
              <Icon className={clsx('w-4 h-4 flex-shrink-0', isActive ? 'text-white' : 'text-slate-400')} />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Session Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-3 px-2 py-1.5">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
            {member.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-semibold text-white truncate">{member.name}</span>
            <span className="text-[11px] text-slate-400 truncate">{ROLE_LABELS[member.role]}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
