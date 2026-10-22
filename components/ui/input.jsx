import React from 'react';
import { cn } from './utils';

export const Input = React.forwardRef(function Input(
  { className = '', type = 'text', disabled = false, ...props },
  ref
) {
  return (
    <input
      type={type}
      ref={ref}
      disabled={disabled}
      className={cn(
        'w-full h-9 px-3 py-1.5 bg-[#09090b] border border-white/15 rounded text-xs text-[#f5f7fa] placeholder:text-zinc-500 focus:outline-none focus:border-[#00e5ff] focus:ring-1 focus:ring-[#00e5ff] transition-all disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
      {...props}
    />
  );
});
