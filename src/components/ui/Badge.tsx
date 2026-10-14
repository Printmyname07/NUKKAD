import React from 'react';

export type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'outline'
  | 'crowd-low'
  | 'crowd-moderate'
  | 'crowd-high'
  | 'crowd-unknown';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = '',
  icon,
}) => {
  const baseClasses =
    'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide';

  const variantClasses: Record<BadgeVariant, string> = {
    default: 'bg-slate-100 text-slate-800 border border-slate-200',
    success: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200',
    danger: 'bg-rose-50 text-rose-800 border border-rose-200',
    info: 'bg-blue-50 text-blue-800 border border-blue-200',
    outline: 'bg-transparent text-slate-600 border border-slate-300',
    'crowd-low': 'bg-emerald-100 text-emerald-900 border border-emerald-300',
    'crowd-moderate': 'bg-amber-100 text-amber-900 border border-amber-300',
    'crowd-high': 'bg-rose-100 text-rose-900 border border-rose-300',
    'crowd-unknown': 'bg-slate-100 text-slate-600 border border-slate-300',
  };

  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {icon}
      <span>{children}</span>
    </span>
  );
};
