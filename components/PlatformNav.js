'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TIMECAPSULE_BRAND } from '@/branding';

export const PRIMARY_NAV = [
  { label: 'Explore', href: '/explore' },
  { label: 'Rankings', href: '/rankings' },
  { label: 'Docs', href: '/docs' },
  { label: 'Blog', href: '/blog' },
  { label: 'Community', href: 'https://github.com/MetawebTenologies/studio', external: true },
];

export const APP_SUBNAV = [
  { label: 'Dashboard', href: '/dashboard', status: 'working' },
  { label: 'Explore', href: '/explore', status: 'working' },
  { label: 'Assistant', href: '/assistant', status: 'planned' },
  { label: 'Workflow', href: '/workflows', status: 'preview' },
  { label: 'Agents', href: '/agents', status: 'planned' },
  { label: 'Apps', href: '/apps', status: 'preview' },
  { label: 'Studio', href: '/studio', status: 'working', badge: 'HOT' },
  { label: 'API Keys', href: '/api-keys', status: 'planned' },
  { label: 'Integrations', href: '/integrations', status: 'preview' },
  { label: 'MCP & CLI', href: '/cli', status: 'working' },
  { label: 'Billing', href: '/billing', status: 'planned' },
  { label: 'Referral', href: '/referrals', status: 'planned' },
  { label: 'White Label', href: '/white-label', status: 'planned' },
  { label: 'Usage', href: '/usage', status: 'working' },
];

export default function PlatformNav({ activeModule = 'studio' }) {
  const pathname = usePathname();

  return (
    <header className="flex-shrink-0 bg-[#09090b] border-b border-white/10 z-40">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 lg:px-8 py-3 border-b border-white/5">
        <div className="flex items-center gap-8">
          <Link href="/explore" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#00e5ff]/15 border border-[#00e5ff]/40 flex items-center justify-center text-[#00e5ff] font-black text-sm group-hover:border-[#00e5ff] transition-colors">
              TC
            </div>
            <span className="text-white font-black text-lg tracking-wider uppercase">
              {TIMECAPSULE_BRAND.name}
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {PRIMARY_NAV.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                target={item.external ? '_blank' : undefined}
                className={`text-sm font-semibold transition-colors ${
                  pathname === item.href
                    ? 'text-[#00e5ff]'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center bg-white/5 border border-white/10 rounded-full px-3.5 py-1.5 w-64 focus-within:border-[#00e5ff]/50 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/40 mr-2.5">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search models & tools..."
              className="bg-transparent text-xs text-white placeholder:text-white/30 focus:outline-none w-full"
            />
          </div>

          <Link
            href="/studio?mode=preview"
            className="px-4 py-1.5 rounded-full bg-[#00e5ff] text-black text-xs font-black hover:opacity-90 transition-opacity"
          >
            Launch Studio
          </Link>
        </div>
      </div>

      {/* Secondary Horizontal Sub-Nav */}
      <div className="flex items-center px-4 lg:px-8 overflow-x-auto no-scrollbar py-1">
        <div className="flex items-center gap-1 min-w-max">
          {APP_SUBNAV.map((item) => {
            const isActive = pathname === item.href || (item.href === '/studio' && pathname.startsWith('/studio'));
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`relative px-3.5 py-2 text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  isActive
                    ? 'text-[#00e5ff]'
                    : 'text-white/60 hover:text-white hover:bg-white/5 rounded-lg'
                }`}
              >
                <span>{item.label}</span>
                {item.badge && (
                  <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-400 text-black leading-tight">
                    {item.badge}
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#00e5ff] rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
