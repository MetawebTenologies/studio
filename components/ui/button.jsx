import React from 'react';
import { cn } from './utils';

export const Button = React.forwardRef(function Button(
  {
    className = '',
    variant = 'default',
    size = 'default',
    disabled = false,
    type = 'button',
    children,
    ...props
  },
  ref
) {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00e5ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090b] disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none';

  const variants = {
    default: 'bg-[#00e5ff] hover:bg-[#38bdf8] text-[#09090b]',
    primary: 'bg-blue-600 hover:bg-blue-500 text-white',
    secondary: 'bg-[#181820] hover:bg-[#22222c] text-zinc-200 border border-white/10',
    outline: 'border border-white/15 hover:border-white/30 text-zinc-200 hover:bg-white/5',
    ghost: 'hover:bg-white/5 text-zinc-300 hover:text-white',
    destructive: 'bg-rose-600 hover:bg-rose-500 text-white',
  };

  const sizes = {
    default: 'h-9 px-4 py-2 text-xs',
    sm: 'h-7 px-3 text-[11px]',
    lg: 'h-11 px-6 text-sm',
    icon: 'h-8 w-8 p-0',
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={cn(baseStyles, variants[variant] || variants.default, sizes[size] || sizes.default, className)}
      {...props}
    >
      {children}
    </button>
  );
});
