import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'secondary' | 'teal' | 'emerald' | 'amber' | 'slate' | 'outline' | 'blue' | 'red' | 'purple';
  size?: 'sm' | 'md';
}

export function Badge({
  className,
  variant = 'default',
  size = 'sm',
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: 'bg-zinc-100 text-zinc-800 border-zinc-200/70',
    secondary: 'bg-slate-100 text-slate-700 border-slate-200/80 font-medium',
    teal: 'bg-teal-50 text-teal-800 border-teal-200/60 font-medium',
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200/60 font-medium',
    amber: 'bg-amber-50 text-amber-800 border-amber-200/60 font-medium',
    slate: 'bg-slate-100 text-slate-700 border-slate-200/80',
    blue: 'bg-sky-50 text-sky-800 border-sky-200/60 font-medium',
    red: 'bg-rose-50 text-rose-800 border-rose-200/60 font-medium',
    purple: 'bg-purple-50 text-purple-800 border-purple-200/60 font-medium',
    outline: 'bg-transparent text-zinc-600 border-zinc-200',
  };

  const sizeStyles = {
    sm: 'text-[11px] leading-tight px-2 py-0.5 font-medium tracking-tight',
    md: 'text-xs leading-normal px-2.5 py-0.75 font-medium tracking-tight',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border transition-colors whitespace-nowrap select-none',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
