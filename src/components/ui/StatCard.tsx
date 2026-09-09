import React from 'react';
import clsx from 'clsx';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: string;
  isPositive?: boolean;
  icon?: React.ReactNode;
  iconBgColor?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  change,
  isPositive,
  icon,
  iconBgColor = 'bg-brand-50 text-brand-600',
  className,
}: StatCardProps) {
  return (
    <div className={clsx('rounded-xl border border-slate-200 bg-white p-5 shadow-sm', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
        {icon && <div className={clsx('flex h-10 w-10 items-center justify-center rounded-lg', iconBgColor)}>{icon}</div>}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-slate-900">{value}</span>
        {change && (
          <span
            className={clsx(
              'text-xs font-semibold',
              isPositive ? 'text-emerald-600' : isPositive === false ? 'text-rose-600' : 'text-slate-500'
            )}
          >
            {change}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
    </div>
  );
}

// Utility to format INR Indian currency cleanly
export function formatINR(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} Lakh`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
}
