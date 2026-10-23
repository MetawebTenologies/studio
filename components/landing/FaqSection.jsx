'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { TIMECAPSULE_BRAND } from '@/branding';

const FAQS = [
  {
    q: 'How does Timecapsule unify multiple AI generation providers into one API?',
    a: 'Timecapsule exposes a single, standardized REST seam for 600+ foundation models across text-to-image, image-to-video, inpainting, and lip-sync. You send a uniform request payload, and our Backend-For-Frontend (BFF) translates parameters, routes to the verified upstream provider gateway, and streams progress back via Server-Sent Events (SSE).',
  },
  {
    q: 'What happens if an upstream provider fails or experiences downtime?',
    a: 'Our architecture enforces strict fail-closed model pinning. We never silently substitute a requested model with a cheaper or inferior alternative. If an upstream gateway returns an error or timeout, our circuit breaker triggers an automatic, atomic refund back to your credit ledger, preventing unexpected costs.',
  },
  {
    q: 'How does credit reservation and double-entry ledger billing work?',
    a: 'Before any job is dispatched to a generation worker, credits are reserved in PostgreSQL with an ACID-compliant double-entry ledger transaction. Once the job succeeds, the exact cost is settled. If the job fails or is cancelled, the reservation is rolled back instantly without balance corruption.',
  },
  {
    q: 'Can I white-label or self-host Timecapsule Studio for my own business?',
    a: 'Yes. Timecapsule includes complete multi-tenant Row Level Security (RLS) and white-label branding controls. You can deploy your own domain, configure custom tenant branding (logo, colors, name), and manage user memberships with isolated workspace data.',
  },
  {
    q: 'How are provider credentials and API keys kept secure?',
    a: 'Upstream provider keys (such as Muapi) are stored strictly server-side in encrypted environment variables or tenant credential vaults. Browser clients never receive or execute with provider secrets, eliminating API key leakage risks.',
  },
  {
    q: 'How do I get an API key and start integrating via CLI or MCP?',
    a: 'You can generate a tenant API key directly from your dashboard or use our integrated MCP server to interface with agentic tools like Cursor and Claude. Visit our Docs or CLI page for copy-paste installation commands.',
  },
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState(0);

  const toggle = (idx) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="py-20 sm:py-28 bg-[#08080a] border-b border-white/5 relative">
      <div className="max-w-[1000px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#00e5ff] font-mono">
            QUESTIONS &amp; ANSWERS
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-[#f5f7fa] tracking-tight mt-2 mb-3">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Everything you need to know about integrating, billing, and scaling with {TIMECAPSULE_BRAND.name}.
          </p>
        </div>

        {/* Accordion List */}
        <div className="flex flex-col gap-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={faq.q}
                className="bg-[#121217] border border-white/10 hover:border-white/20 rounded-xl transition-all overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  aria-expanded={isOpen}
                  className="w-full px-5 py-4 sm:px-6 sm:py-5 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#00e5ff]"
                >
                  <span className="text-sm sm:text-base font-bold text-[#f5f7fa] pr-4">
                    {faq.q}
                  </span>
                  <div
                    className={`w-7 h-7 rounded-lg bg-[#181820] border border-white/10 flex items-center justify-center shrink-0 text-zinc-400 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[#00e5ff] border-[#00e5ff]/40' : ''
                    }`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-0 text-xs sm:text-sm text-zinc-400 leading-relaxed border-t border-white/5 animate-fade-in-up">
                    <p className="pt-3">{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Support CTA Callout */}
        <div className="mt-12 bg-[#0d0d12] border border-white/10 rounded-2xl p-6 sm:p-8 text-center flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left">
            <h4 className="text-sm font-bold text-white mb-1">
              Still have questions about our pipeline architecture?
            </h4>
            <p className="text-xs text-zinc-400">
              Read our technical documentation or check our live model status.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/docs"
              className="px-5 py-2.5 rounded-lg bg-[#181820] hover:bg-[#20202c] border border-white/10 text-xs font-bold text-white transition-all whitespace-nowrap"
            >
              Documentation
            </Link>
            <Link
              href="/explore"
              className="px-5 py-2.5 rounded-lg bg-[#00e5ff] hover:bg-[#38bdf8] text-[#08080a] text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap shadow-sm"
            >
              Try Studio
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
