'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import {
  LayoutDashboard,
  Users,
  KanbanSquare,
  Boxes,
  Compass,
} from 'lucide-react';

interface MobileBottomNavProps {
  slug: string;
}

export function MobileBottomNav({ slug }: MobileBottomNavProps) {
  const pathname = usePathname();

  const navTabs = [
    {
      name: 'Overview',
      href: `/app/${slug}/dashboard`,
      icon: LayoutDashboard,
      active: pathname === `/app/${slug}/dashboard`,
    },
    {
      name: 'Leads',
      href: `/app/${slug}/leads`,
      icon: Users,
      active: pathname === `/app/${slug}/leads`,
    },
    {
      name: 'Kanban',
      href: `/app/${slug}/leads/kanban`,
      icon: KanbanSquare,
      active: pathname === `/app/${slug}/leads/kanban`,
    },
    {
      name: 'Inventory',
      href: `/app/${slug}/inventory`,
      icon: Boxes,
      active: pathname === `/app/${slug}/inventory`,
    },
    {
      name: 'Visits',
      href: `/app/${slug}/site-visits`,
      icon: Compass,
      active: pathname === `/app/${slug}/site-visits`,
    },
  ];

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-2 py-1.5 shadow-2xl safe-area-pb"
    >
      <div className="flex items-center justify-around">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={clsx(
                'flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-150 min-w-[56px]',
                tab.active
                  ? 'text-brand-400 bg-brand-950/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 active:scale-95'
              )}
            >
              <Icon className={clsx('w-5 h-5 mb-0.5', tab.active ? 'text-brand-400 stroke-[2.2]' : 'text-slate-400')} />
              <span className="text-[10px] tracking-tight truncate">{tab.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
