'use client';

import React from 'react';
import { TIMECAPSULE_BRAND } from '@/branding';

const REASONS = [
  {
    title: 'Unified Multimodal Seam',
    desc: 'One standardized payload format across 600+ text-to-image, image-to-video, inpainting, and lip-sync endpoints. Switch engines without refactoring.',
    badge: 'API CONTRACT',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </svg>
    ),
  },
  {
    title: 'Fail-Closed Model Pinning',
    desc: 'Never worry about silent model substitutions or unexpected quality drops. If a requested model is unavailable, the pipeline fails cleanly with full audit logs.',
    badge: 'DETERMINISTIC',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
  {
    title: 'Double-Entry Credit Ledger',
    desc: 'ACID-compliant reservations before task dispatch. Automatic refunds on timeout or provider error with verifiable transaction history.',
    badge: 'ZERO OVERCHARGE',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
  {
    title: 'Multi-Tenant Postgres RLS',
    desc: 'Enterprise-grade isolation at the database layer. Cross-tenant leakage is mathematically barred by PostgreSQL Row-Level Security policies.',
    badge: 'ENTERPRISE ISOLATION',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9b8cff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    title: 'Fenced Leases & SSE Replay',
    desc: 'Durable background worker orchestration with heartbeat fences. Ordered Server-Sent Events allow instant client reconnects with zero lost frames.',
    badge: 'FAULT TOLERANT',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    title: 'Zero Provider Lock-In',
    desc: 'Host on your own cloud or connect direct upstream provider credentials. Complete white-label support for building proprietary AI SaaS tools.',
    badge: 'OPEN ARCHITECTURE',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </svg>
    ),
  },
];

export default function WhyDevelopersChooseSection() {
  return (
    <section className="py-20 sm:py-28 bg-[#09090c] border-b border-white/5 relative">
      <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#00e5ff] font-mono">
            WHY DEVELOPERS CHOOSE {TIMECAPSULE_BRAND.name.toUpperCase()}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#f5f7fa] tracking-tight mt-2 mb-4">
            Built for High-Scale Production AI
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed max-w-2xl mx-auto">
            We abstract away the complexity of handling multiple generation platforms, so you can focus entirely on building your application.
          </p>
        </div>

        {/* 6-Card Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {REASONS.map((reason) => (
            <div
              key={reason.title}
              className="bg-[#121217] border border-white/10 hover:border-[#00e5ff]/50 rounded-2xl p-6 sm:p-7 shadow-xl hover:shadow-[0_0_25px_rgba(0,229,255,0.1)] transition-all duration-300 group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-[#181820] border border-white/10 flex items-center justify-center group-hover:border-[#00e5ff]/50 group-hover:bg-[#1a1a24] transition-all shadow-sm">
                    {reason.icon}
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#181822] text-zinc-400 border border-white/5 group-hover:text-zinc-200 transition-colors">
                    {reason.badge}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-[#f5f7fa] group-hover:text-white transition-colors mb-2.5">
                  {reason.title}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  {reason.desc}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex items-center text-[11px] font-mono font-semibold text-[#00e5ff] opacity-80 group-hover:opacity-100 transition-opacity">
                <span>Verified in test suite →</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
