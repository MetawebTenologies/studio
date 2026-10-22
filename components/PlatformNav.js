'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TIMECAPSULE_BRAND } from '@/branding';

export const PRIMARY_NAV = [
  { label: 'Explore', href: '/explore' },
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

export default function PlatformNav({ activeModule = 'studio' }) {
  const pathname = usePathname();

  return (
    <header className="flex-shrink-0 bg-[var(--tc-bg-card,#ffffff)]/90 border-b border-[var(--tc-border-divider,rgba(226,232,240,0.8))] z-40 sticky top-0 backdrop-blur-md transition-all">
      {/* Top Header Row — 1400px Max Width */}
      <div className="max-w-[1400px] mx-auto flex items-center justify-between px-4 sm:px-6 xl:px-0 h-16">
        {/* Left: Brand + Public Navigation */}
        <div className="flex items-center gap-8">
          <Link href="/explore" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#09090b] border border-white/10 flex items-center justify-center p-1.5 shadow-sm group-hover:border-[#00e5ff]/50 transition-colors">
              <svg viewBox="0 0 240 240" className="w-full h-full" fill="none">
                <path d="M 36 45 H 180 V 69 H 60 V 129 H 132 V 153 H 36 Z" fill="#F5F7FA" />
                <path d="M 108 87 H 204 V 195 H 60 V 171 H 180 V 111 H 108 Z" fill="#00E5FF" />
              </svg>
            </div>
            <span className="text-[var(--tc-text-primary,#0f172a)] font-extrabold text-base tracking-widest uppercase">
              {TIMECAPSULE_BRAND.name}
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-6" aria-label="Main Navigation">
            {PRIMARY_NAV.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href === '/explore' && (pathname === '/' || pathname === '/explore'));

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  target={item.external ? '_blank' : undefined}
                  className={`inline-flex min-h-9 items-center text-[13px] font-semibold transition-all relative ${
                    isActive
                      ? 'text-[var(--tc-color-primary,#3b82f6)] font-bold'
                      : 'text-[var(--tc-text-secondary,#475569)] hover:text-[var(--tc-text-primary,#0f172a)]'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <div className="absolute -bottom-[16px] left-0 right-0 h-0.5 bg-[var(--tc-color-primary,#3b82f6)]" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Search + Sign In Pill + Avatar */}
        <div className="flex items-center gap-3">
          <Link
            href="/explore"
            aria-label="Search models"
            className="w-9 h-9 rounded-full bg-[var(--tc-bg-page,#f8fafc)] hover:bg-[var(--tc-bg-subtle,#f1f5f9)] border border-[var(--tc-border-card,#e2e8f0)] flex items-center justify-center text-[var(--tc-text-secondary,#475569)] hover:text-[var(--tc-text-primary,#0f172a)] transition-colors shadow-xs"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </Link>

          <Link
            href="/studio?preview=1"
            className="px-4 py-2 rounded-full bg-[var(--tc-color-primary,#3b82f6)] hover:bg-[var(--tc-color-primary-hover,#2563eb)] text-white text-xs font-semibold transition-all shadow-sm"
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

      {/* Secondary Horizontal Sub-Nav */}
      <div className="border-t border-[var(--tc-border-divider,rgba(226,232,240,0.7))] bg-[var(--tc-bg-page,#f8fafc)]/60">
        <div className="max-w-[1400px] mx-auto flex items-center px-4 sm:px-6 xl:px-0 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-6 min-w-max">
            {APP_SUBNAV.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href.startsWith('/studio') && pathname.startsWith('/studio')) ||
                (item.href === '/explore' && (pathname === '/explore' || pathname === '/'));

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`relative py-2.5 text-[12px] md:text-[13px] font-medium transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? 'text-[var(--tc-text-primary,#0f172a)] font-bold'
                      : 'text-[var(--tc-text-secondary,#475569)] hover:text-[var(--tc-text-primary,#0f172a)]'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.greenBadge && (
                    <span className="text-[11px] font-bold text-emerald-500 leading-none">
                      {item.greenBadge}
                    </span>
                  )}
                  {item.badge && (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-[var(--tc-color-badge-amber,#eab308)] text-black leading-none">
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--tc-color-primary,#3b82f6)] rounded-t-full" />
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
