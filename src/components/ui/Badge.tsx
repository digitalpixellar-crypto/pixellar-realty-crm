import React from 'react';
import clsx from 'clsx';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({ children, variant = 'default', size = 'sm', className }: BadgeProps) {
  const variantStyles = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    primary: 'bg-blue-50 text-blue-700 border-blue-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    neutral: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs font-medium',
    md: 'px-2.5 py-1 text-sm font-medium',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full border',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  switch (status.toLowerCase()) {
    case 'available':
      return <Badge variant="success">● Available</Badge>;
    case 'on_hold':
      return <Badge variant="warning">⏱ On Hold</Badge>;
    case 'booked':
      return <Badge variant="primary">★ Booked</Badge>;
    case 'sold':
      return <Badge variant="neutral">✓ Sold Out</Badge>;
    case 'blocked':
      return <Badge variant="danger">✕ Blocked</Badge>;
    case 'active':
      return <Badge variant="success">Active</Badge>;
    case 'trial':
    case 'trialing':
      return <Badge variant="info">Free Trial</Badge>;
    case 'suspended':
    case 'past_due':
      return <Badge variant="danger">Suspended</Badge>;
    case 'confirmed':
      return <Badge variant="success">Confirmed</Badge>;
    case 'scheduled':
      return <Badge variant="primary">Scheduled</Badge>;
    case 'completed':
      return <Badge variant="success">Completed</Badge>;
    case 'cancelled':
    case 'canceled':
      return <Badge variant="danger">Cancelled</Badge>;
    case 'reconciled':
    case 'paid':
      return <Badge variant="success">Paid & Reconciled</Badge>;
    case 'recorded':
    case 'pending':
      return <Badge variant="warning">Pending Verification</Badge>;
    case 'hot':
      return <Badge variant="danger">🔥 Hot</Badge>;
    case 'warm':
      return <Badge variant="warning">⚡ Warm</Badge>;
    case 'cold':
      return <Badge variant="info">❄ Cold</Badge>;
    case 'urgent':
      return <Badge variant="danger">Urgent</Badge>;
    case 'high':
      return <Badge variant="warning">High</Badge>;
    default:
      return <Badge variant="default">{status}</Badge>;
  }
}
