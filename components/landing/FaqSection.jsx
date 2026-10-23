'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { TIMECAPSULE_BRAND } from '@/branding';

const FAQS = [
  {
    q: 'How do I integrate the API in under 5 lines of code?',
    a: `Getting started is simple. Authenticate with your secure x-api-key header and send a POST request with your model name and prompt. Our unified gateway handles parameters, executes the task on high-performance infrastructure, and returns or streams results back via webhook or SSE.`,
  },
  {
    q: 'How does the flexible credit system and billing work?',
    a: `Timecapsule operates on a transparent pay-per-second and pay-per-generation credit ledger. Before task execution, credits are reserved in an ACID-compliant PostgreSQL transaction. You only pay for successful generations, and many models are 30% to 70% cheaper than direct provider retail.`,
  },
  {
    q: 'What happens if a generation task fails or times out?',
    a: `We enforce strict fail-closed model pinning and zero overcharge guarantees. If an upstream provider gateway experiences an outage, 429 rate limit, or timeout, the transaction rolls back atomically, and reserved credits are instantly restored to your balance. We never silently substitute an inferior model.`,
  },
  {
    q: 'How do webhooks and status polling work?',
    a: `You can provide a webhook URL in your request payload to receive an instant push notification with the final MP4/PNG URLs as soon as media rendering completes. Alternatively, our API provides real-time Server-Sent Events (SSE) and standard GET polling endpoints with ~120ms average response latency.`,
  },
  {
    q: 'Can I switch models without changing my code or backend schema?',
    a: `Yes. All 30+ certified foundation models—including Google Veo 3.1, Seedance 2.5, Flux Dev, Kling 2.1, and Nano Banana Pro—share a unified request and response contract. You can switch between video, image, and editing engines by changing a single 'model' parameter.`,
  },
  {
    q: 'How does Timecapsule ensure enterprise security and data privacy?',
    a: `All API communication is encrypted with TLS 1.3 in transit. Task data is processed in isolated ephemeral sandboxes, and generated media is subject to customizable auto-purge retention policies. Multi-tenant PostgreSQL Row-Level Security (RLS) ensures complete data quarantine across tenant boundaries.`,
  },
  {
    q: 'Can I white-label or self-host Timecapsule Studio for my agency or SaaS?',
    a: `Yes. Timecapsule Studio includes enterprise white-label capabilities out of the box. You can connect custom domain hostnames, brand the studio with your company logos and hex colors, and provision isolated team workspaces.`,
  },
  {
    q: 'How do I get an API key and start developing?',
    a: `You can generate a developer API key immediately from your Dashboard. We also provide native SDKs for Python, Node.js/TypeScript, and an official Model Context Protocol (MCP) server for integration with Cursor, Claude, and autonomous agents.`,
  },
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState(0);

  const toggle = (idx) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-20 sm:py-28 bg-[#08080a] border-b border-white/5 relative">
      <div className="max-w-[1040px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#00e5ff]/10 border border-[#00e5ff]/30 text-[#00e5ff] text-[11px] font-bold uppercase tracking-wider mb-4">
            FREQUENTLY ASKED QUESTIONS
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#f5f7fa] tracking-tight mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
            Everything you need to know about integrating, billing, and scaling with {TIMECAPSULE_BRAND.name}.
          </p>
        </div>

        {/* Accordion List */}
        <div className="flex flex-col gap-3.5">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={faq.q}
                className={`bg-[#0d0d14] border rounded-2xl transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? 'border-[#00e5ff]/50 shadow-[0_0_20px_rgba(0,229,255,0.08)]'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  aria-expanded={isOpen}
                  className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-hidden"
                >
                  <span className="text-sm sm:text-base font-bold text-[#f5f7fa] pr-4">
                    {faq.q}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-xl bg-[#14141e] border flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isOpen
                        ? 'rotate-180 text-[#00e5ff] border-[#00e5ff]/40'
                        : 'text-zinc-400 border-white/10'
                    }`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-0 text-xs sm:text-sm text-zinc-400 leading-relaxed border-t border-white/5">
                    <p className="pt-4">{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Support CTA Callout */}
        <div className="mt-14 bg-[#0d0d14] border border-white/10 rounded-2xl p-6 sm:p-8 text-center flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-left">
            <h4 className="text-sm sm:text-base font-bold text-white mb-1">
              Still have questions about our pipeline architecture?
            </h4>
            <p className="text-xs text-zinc-400">
              Read our technical documentation or check our live model status.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/docs"
              className="px-5 py-2.5 rounded-lg bg-[#181822] hover:bg-[#20202e] border border-white/10 text-xs font-bold text-white transition-all whitespace-nowrap cursor-pointer"
            >
              Documentation
            </Link>
            <Link
              href="/explore"
              className="px-5 py-2.5 rounded-lg bg-[#00e5ff] hover:bg-[#38bdf8] text-[#08080a] text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap shadow-sm cursor-pointer"
            >
              Try Studio
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
