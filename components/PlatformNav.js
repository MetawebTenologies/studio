'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TIMECAPSULE_BRAND } from '@/branding';
import NavCreditPill from '@/components/NavCreditPill';

export const PRIMARY_NAV = [
  { label: 'Explore', href: '/explore', count: 627 },
  { label: 'Providers', href: '/providers', count: 25 },
  { label: 'Rankings', href: '/rankings' },
  { label: 'White-Label', href: '/white-label' },
  { label: 'Docs', href: '/docs' },
  { label: 'Blog', href: '/blog' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Discord', href: 'https://github.com/MetawebTenologies/studio', external: true },
];

export const APP_SUBNAV = [
  { label: 'Dashboard', href: '/dashboard', status: 'working' },
  { label: 'Explore', href: '/explore', status: 'working' },
  { label: 'Assistant', href: '/assistant', status: 'planned' },
  { label: 'Workflow', href: '/workflows', status: 'preview' },
  { label: 'Agents', href: '/agents', status: 'planned' },
  { label: 'Apps', href: '/apps', status: 'preview', greenBadge: '$' },
  { label: 'Studio', href: '/studio?preview=1', status: 'working', badge: 'HOT' },
  { label: 'White-Label', href: '/white-label', status: 'working' },
  { label: 'API Keys', href: '/api-keys', status: 'planned' },
  { label: 'Integrations', href: '/integrations', status: 'preview' },
  { label: 'MCP & CLI', href: '/cli', status: 'working' },
  { label: 'Billing', href: '/billing', status: 'planned' },
  { label: 'Referral', href: '/referrals', status: 'planned' },
  { label: 'Usage', href: '/usage', status: 'working' },
];

export default function PlatformNav({ activeModule = 'studio', showSubnav = true }) {
  const pathname = usePathname();

  return (
    <header className="flex-shrink-0 bg-[#09090b]/90 border-b border-white/10 z-40 sticky top-0 backdrop-blur-md transition-all">
      {/* Top Header Row — 1400px Max Width */}
      <div className="max-w-[1400px] mx-auto flex items-center justify-between px-4 sm:px-6 xl:px-0 h-16">
        {/* Left: Brand + Public Navigation */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#09090b] border border-white/10 flex items-center justify-center p-1.5 shadow-sm group-hover:border-[#00e5ff]/50 transition-colors">
              <svg viewBox="0 0 240 240" width="20" height="20" className="w-full h-full" fill="none">
                <path d="M 36 45 H 180 V 69 H 60 V 129 H 132 V 153 H 36 Z" fill="#F5F7FA" />
                <path d="M 108 87 H 204 V 195 H 60 V 171 H 180 V 111 H 108 Z" fill="#00E5FF" />
              </svg>
            </div>
            <span className="text-[#f5f7fa] font-extrabold text-base tracking-widest uppercase">
              {TIMECAPSULE_BRAND.name}
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-3.5 lg:gap-6 whitespace-nowrap" aria-label="Main Navigation">
            {PRIMARY_NAV.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href === '/explore' && pathname === '/explore');

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  target={item.external ? '_blank' : undefined}
                  className={`inline-flex min-h-9 items-center gap-1.5 text-[13px] font-semibold transition-all relative ${
                    isActive
                      ? 'text-[#00e5ff] font-bold'
                      : 'text-zinc-400 hover:text-[#f5f7fa]'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.count && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-[#181820] text-zinc-400 border border-white/10 group-hover:text-white transition-colors">
                      {item.count}
                    </span>
                  )}
                  {isActive && (
                    <div className="absolute -bottom-[16px] left-0 right-0 h-0.5 bg-[#00e5ff]" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Search + Live Credit Pill + Sign In + Avatar */}
        <div className="flex items-center gap-3">
          <Link
            href="/explore"
            aria-label="Search models"
            className="w-9 h-9 rounded-full bg-[#121217] hover:bg-[#181820] border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors shadow-xs"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </Link>

          <NavCreditPill />

          <Link
            href="/studio?preview=1"
            className="px-4 py-2 rounded-full bg-[#00e5ff] hover:bg-[#38bdf8] text-[#09090b] text-xs font-bold uppercase tracking-wider transition-all shadow-sm"
          >
            Sign In
          </Link>

          <div
            className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00e5ff] to-[#9b8cff] flex items-center justify-center text-[#09090b] text-[10px] font-black ring-2 ring-[#09090b]/30 select-none shadow-xs"
            title="Single-Tenant Workspace User"
          >
            <svg viewBox="0 0 240 240" width="16" height="16" fill="none">
              <path d="M 36 45 H 180 V 69 H 60 V 129 H 132 V 153 H 36 Z" fill="#09090B" />
              <path d="M 108 87 H 204 V 195 H 60 V 171 H 180 V 111 H 108 Z" fill="#09090B" fillOpacity="0.6" />
            </svg>
          </div>
        </div>
      </div>

      {/* Secondary Horizontal Sub-Nav (Optional for app pages, hidden on landing) */}
      {showSubnav && (
        <div className="border-t border-white/10 bg-[#0c0c10]/80">
          <div className="max-w-[1400px] mx-auto flex items-center px-4 sm:px-6 xl:px-0 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-6 min-w-max">
              {APP_SUBNAV.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href.startsWith('/studio') && pathname.startsWith('/studio')) ||
                  (item.href === '/explore' && pathname === '/explore');

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`relative py-2.5 text-[12px] md:text-[13px] font-medium transition-colors flex items-center gap-1.5 ${
                      isActive
                        ? 'text-[#f5f7fa] font-bold'
                        : 'text-zinc-400 hover:text-[#f5f7fa]'
                    }`}
                  >
                    <span>{item.label}</span>
                    {item.greenBadge && (
                      <span className="text-[11px] font-bold text-emerald-400 leading-none">
                        {item.greenBadge}
                      </span>
                    )}
                    {item.badge && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-400 text-[#09090b] leading-none">
                        {item.badge}
                      </span>
                    )}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#00e5ff] rounded-t-full" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
