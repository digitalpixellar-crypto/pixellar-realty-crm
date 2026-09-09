import React from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  leftIcon,
  rightIcon,
  ...props
}: ButtonProps) {
  const variantStyles = {
    primary: 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm border border-transparent focus-visible:ring-brand-500',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200 focus-visible:ring-slate-400',
    outline: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-sm focus-visible:ring-slate-400',
    ghost: 'hover:bg-slate-100 text-slate-700 focus-visible:ring-slate-400',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm border border-transparent focus-visible:ring-rose-500',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm border border-transparent focus-visible:ring-emerald-500',
  };

  const sizeStyles = {
    sm: 'px-2.5 py-1.5 text-xs rounded-md gap-1.5',
    md: 'px-3.5 py-2 text-sm rounded-lg gap-2',
    lg: 'px-4 py-2.5 text-base rounded-lg gap-2.5',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={clsx(
        'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {!isLoading && leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
}
