import React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'teal';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      icon,
      iconPosition = 'left',
      fullWidth = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    // Exact 2x horizontal to vertical padding ratio:
    // sm: py-1.5 px-3 (6px / 12px)
    // md: py-2 px-4 (8px / 16px)
    // lg: py-2.5 px-5 (10px / 20px)
    const sizeStyles = {
      sm: 'py-1.5 px-3 text-xs gap-1.5 rounded-lg',
      md: 'py-2 px-4 text-sm gap-2 rounded-lg',
      lg: 'py-2.5 px-5 text-sm gap-2.5 rounded-lg font-medium',
    };

    const variantStyles = {
      primary:
        'bg-zinc-900 text-white hover:bg-zinc-800 active:bg-zinc-950 shadow-xs border border-zinc-900 focus-visible:ring-2 focus-visible:ring-zinc-900/20',
      secondary:
        'bg-zinc-100 text-zinc-900 hover:bg-zinc-200/80 active:bg-zinc-200 border border-zinc-200/60 focus-visible:ring-2 focus-visible:ring-zinc-400/30',
      outline:
        'bg-white text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 border border-zinc-200 shadow-2xs focus-visible:ring-2 focus-visible:ring-zinc-300',
      ghost:
        'bg-transparent text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 border border-transparent focus-visible:ring-2 focus-visible:ring-zinc-300',
      teal:
        'bg-teal-700 text-white hover:bg-teal-800 active:bg-teal-900 shadow-xs border border-teal-800 focus-visible:ring-2 focus-visible:ring-teal-700/20',
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all duration-150 whitespace-nowrap select-none cursor-pointer focus:outline-hidden disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed',
          sizeStyles[size],
          variantStyles[variant],
          fullWidth ? 'w-full' : '',
          className
        )}
        {...props}
      >
        {icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}
        {children && <span>{children}</span>}
        {icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
