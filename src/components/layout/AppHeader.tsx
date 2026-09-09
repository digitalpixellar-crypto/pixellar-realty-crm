'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Company, CompanyMember } from '@/types';
import { ROLE_LABELS } from '@/lib/auth/permissions';
import {
  Building2,
  UserCheck,
  ShieldAlert,
  Plus,
  LogOut,
  ChevronDown,
  Bell,
  Search,
} from 'lucide-react';
import Link from 'next/link';

interface AppHeaderProps {
  company: Company;
  member: CompanyMember;
  allCompanies: Company[];
  companyMembers: CompanyMember[];
}

export function AppHeader({ company, member, allCompanies, companyMembers }: AppHeaderProps) {
  const router = useRouter();
  const [isSwitching, setIsSwitching] = useState(false);

  const handleSwitchWorkspace = async (targetSlug: string) => {
    setIsSwitching(true);
    // Switch workspace and navigate
    router.push(`/app/${targetSlug}/dashboard`);
    router.refresh();
    setIsSwitching(false);
  };

  const handleSwitchPersona = async (targetMemberId: string) => {
    setIsSwitching(true);
    try {
      await fetch('/api/auth/switch-persona', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: targetMemberId }),
      });
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Search Bar */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search leads, units, bookings, phone..."
            className="w-full pl-9 pr-4 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-3">
        {/* Workspace Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs">
          <Building2 className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-500 font-medium">Company:</span>
          <select
            value={company.slug}
            onChange={(e) => handleSwitchWorkspace(e.target.value)}
            disabled={isSwitching}
            className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
          >
            {allCompanies.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name} {c.status === 'trial' ? '(Trial)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Role & Persona Switcher (For Pair Programming / Testing) */}
        <div className="flex items-center gap-1.5 bg-brand-50 border border-brand-200 rounded-lg px-2.5 py-1 text-xs">
          <UserCheck className="w-3.5 h-3.5 text-brand-600" />
          <span className="text-brand-700 font-medium">Role:</span>
          <select
            value={member.id}
            onChange={(e) => handleSwitchPersona(e.target.value)}
            disabled={isSwitching}
            className="bg-transparent font-semibold text-brand-900 focus:outline-none cursor-pointer"
          >
            {companyMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({ROLE_LABELS[m.role]})
              </option>
            ))}
          </select>
        </div>

        {/* Platform Owner Dashboard Shortcut */}
        <Link
          href="/platform/dashboard"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-sm"
          title="Switch to SaaS Platform Owner Superadmin panel"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          <span>Platform Owner</span>
        </Link>

        {/* Quick Add Lead Button */}
        <Link
          href={`/app/${company.slug}/leads?action=new`}
          className="flex items-center gap-1 bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Lead</span>
        </Link>

        {/* Logout */}
        <Link
          href="/"
          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          title="Sign out to home"
        >
          <LogOut className="w-4 h-4" />
        </Link>
      </div>
    </header>
  );
}
