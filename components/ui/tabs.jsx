import React, { createContext, useContext, useState } from 'react';
import { cn } from './utils';

const TabsContext = createContext(null);

export function Tabs({ defaultValue, value, onValueChange, className = '', children, ...props }) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const activeValue = value !== undefined ? value : internalValue;

  const setActive = (val) => {
    if (value === undefined) setInternalValue(val);
    if (onValueChange) onValueChange(val);
  };

  return (
    <TabsContext.Provider value={{ activeValue, setActive }}>
      <div className={cn('w-full', className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className = '', children, ...props }) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 p-1 bg-[#121217] border border-white/10 rounded-lg text-xs',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({ value, className = '', children, ...props }) {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('TabsTrigger must be used inside Tabs');
  const isActive = ctx.activeValue === value;

  return (
    <button
      type="button"
      onClick={() => ctx.setActive(value)}
      className={cn(
        'px-3 py-1.5 rounded text-xs font-semibold transition-all cursor-pointer select-none',
        isActive
          ? 'bg-[#00e5ff] text-[#09090b] shadow-xs'
          : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, className = '', children, ...props }) {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('TabsContent must be used inside Tabs');
  if (ctx.activeValue !== value) return null;

  return (
    <div className={cn('mt-4 focus-visible:outline-none', className)} {...props}>
      {children}
    </div>
  );
}
