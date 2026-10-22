'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TIMECAPSULE_BRAND } from '@/branding';

export const PRIMARY_NAV = [
  { label: 'Explore', href: '/explore' },
  { label: 'Rankings', href: '/rankings' },
  { label: 'Docs', href: '/docs' },
  { label: 'Blog', href: '/blog' },
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
    <header className="flex-shrink-0 bg-[#070709] border-b border-[#1c1c22] z-40 sticky top-0 backdrop-blur-md">
      {/* Top Header - Exact Muapi Alignment */}
      <div className="max-w-[1440px] mx-auto flex items-center justify-between px-6 lg:px-8 h-14">
        {/* Left: Brand + Public Nav */}
        <div className="flex items-center gap-8">
          <Link href="/explore" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#00e5ff] via-[#0284c7] to-[#2563eb] flex items-center justify-center text-black font-black text-xs shadow-[0_0_16px_rgba(0,229,255,0.4)]">
              TC
            </div>
            <span className="text-white font-extrabold text-base tracking-widest uppercase">
              {TIMECAPSULE_BRAND.name}
            </span>
          </Link>

          <nav className="flex items-center gap-6">
            {PRIMARY_NAV.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  target={item.external ? '_blank' : undefined}
                  className={`text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-white font-semibold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Search Circle + Sign In + Avatar */}
        <div className="flex items-center gap-3.5">
          <Link
            href="/explore"
            aria-label="Search models"
            className="w-9 h-9 rounded-full bg-[#141418] hover:bg-[#1f1f26] border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </Link>

          <Link
            href="/studio?preview=1"
            className="px-5 py-1.5 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)]"
          >
            Sign In
          </Link>

          <div
            className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white/10 select-none"
            title="Single-Tenant Workspace User"
          >
            TC
          </div>
        </div>
      </div>

      {/* Secondary Horizontal Sub-Nav */}
      <div className="border-t border-[#18181f] bg-[#070709]">
        <div className="max-w-[1440px] mx-auto flex items-center px-6 lg:px-8 overflow-x-auto no-scrollbar">
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
                  className={`relative py-2.5 text-xs md:text-[13px] font-medium transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? 'text-white font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.greenBadge && (
                    <span className="text-[11px] font-bold text-emerald-400 leading-none">
                      {item.greenBadge}
                    </span>
                  )}
                  {item.badge && (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-[#eab308] text-black leading-none">
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500 rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}
