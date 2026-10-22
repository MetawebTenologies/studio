import React from 'react';
import { cn } from './utils';

export function Badge({ className = '', variant = 'default', children, ...props }) {
  const baseStyles =
    'inline-flex items-center font-medium transition-colors select-none font-mono';

  const variants = {
    default: 'bg-[#00e5ff]/15 text-[#00e5ff] border border-[#00e5ff]/30',
    secondary: 'bg-[#181820] text-zinc-300 border border-white/10',
    outline: 'border border-white/15 text-zinc-400',
    success: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    danger: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
    accent: 'bg-purple-500/15 text-purple-400 border border-purple-500/30',
  };

  return (
    <span
      className={cn(baseStyles, variants[variant] || variants.default, 'px-2 py-0.5 rounded text-[10px]', className)}
      {...props}
    >
      {children}
    </span>
  );
}
