'use client';

import React, { useState } from 'react';
import { TIMECAPSULE_BRAND } from '@/branding';

const VOICES = [
  {
    id: '01',
    roleLabel: 'AI VIDEO SAAS FOUNDER',
    author: 'Alexandre Renoir',
    title: 'Founder & CEO',
    company: 'CineForge Studio',
    quote:
      "Timecapsule's unified API cut our video pipeline integration time from three months to under two weeks. The fail-closed model pinning and automatic credit ledger reconciliation eliminate silent failures completely in production.",
    metric: '10M+ frames rendered / mo',
  },
  {
    id: '02',
    roleLabel: 'ENTERPRISE CREATIVE DIRECTOR',
    author: 'Elena Rostova',
    title: 'Head of Synthetic Media',
    company: 'HyperPixel Global',
    quote:
      "Having a single REST seam for Nano Banana, Veo 3.1, and Seedance means our designers can switch visual models by changing a single parameter without our engineering team deploying new infrastructure.",
    metric: '70% compute cost reduction',
  },
  {
    id: '03',
    roleLabel: 'AUTONOMOUS AGENT DEVELOPER',
    author: 'Marcus Vance',
    title: 'Lead AI Engineer',
    company: 'AgenticFlow AI',
    quote:
      "The Model Context Protocol (MCP) and SSE event replay make Timecapsule the only generative media backend our agents can drive autonomously without race conditions or lost progress.",
    metric: '99.9% task completion rate',
  },
  {
    id: '04',
    roleLabel: 'GAMING STUDIO PIPELINE LEAD',
    author: 'Jin-Woo Park',
    title: 'Technical Director',
    company: 'Nexus Realtime Interactive',
    quote:
      "Double-entry credit accounting and multi-tenant RLS isolation gave our security audit team full confidence. We safely white-label the studio directly to our external enterprise clients.",
    metric: '100% tenant data isolation',
  },
  {
    id: '05',
    roleLabel: 'MOBILE APP FOUNDER',
    author: 'Sophia Chen',
    title: 'Co-Founder & CTO',
    company: 'StoryPulse Mobile',
    quote:
      "Webhook callbacks with ~120ms average response latency allowed us to build an instant user-facing generation flow on iOS. Our retention doubled in the first month.",
    metric: '2.4x user retention lift',
  },
  {
    id: '06',
    roleLabel: 'FULLSTACK INFRA ENGINEER',
    author: 'David Lindqvist',
    title: 'Principal Systems Architect',
    company: 'Veloce Cloud',
    quote:
      "The fenced background worker leases and PostgreSQL ACID settlement guarantee that even when upstream providers experience 429s, our customer balances never get corrupted.",
    metric: 'Zero ledger discrepancies',
  },
];

export default function DeveloperVoicesSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeVoice = VOICES[activeIndex];

  return (
    <section className="py-20 sm:py-28 bg-[#09090d] border-b border-white/5 relative overflow-hidden">
      <div className="max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header & Stats Banner */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#00e5ff]/10 border border-[#00e5ff]/30 text-[#00e5ff] text-[11px] font-bold uppercase tracking-wider mb-4">
              DEVELOPER VOICES
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#f5f7fa] tracking-tight mb-4">
              What technical teams value about{' '}
              <span className="bg-gradient-to-r from-[#00e5ff] to-[#38bdf8] bg-clip-text text-transparent">
                {TIMECAPSULE_BRAND.name}
              </span>
            </h2>
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
              Trusted by the builders powering the next generation of AI-native applications.
            </p>
          </div>

          {/* Metrics Card */}
          <div className="flex items-center gap-8 bg-[#121218] border border-white/10 rounded-2xl p-6 shrink-0 shadow-lg">
            <div>
              <span className="text-2xl sm:text-3xl font-black font-mono text-[#00e5ff] block">
                120K+
              </span>
              <span className="text-[11px] font-mono uppercase text-zinc-400 font-bold tracking-wider">
                Developers
              </span>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div>
              <span className="text-2xl sm:text-3xl font-black font-mono text-purple-400 block">
                80+
              </span>
              <span className="text-[11px] font-mono uppercase text-zinc-400 font-bold tracking-wider">
                Countries
              </span>
            </div>
          </div>
        </div>

        {/* Carousel Layout: Left Tabs / Right Quote Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column: Voice Tabs */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400 pb-2 px-1">
              <span className="flex items-center gap-1.5 font-bold">
                <span className="w-2 h-2 rounded-full bg-[#00e5ff] animate-pulse" />
                VOICES
              </span>
              <span>{activeVoice.id} / 06</span>
            </div>

            <div className="space-y-2.5">
              {VOICES.map((v, idx) => {
                const isActive = activeIndex === idx;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    className={`w-full p-4 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer border ${
                      isActive
                        ? 'bg-[#14141e] border-[#00e5ff]/50 shadow-[0_0_15px_rgba(0,229,255,0.15)] text-white'
                        : 'bg-[#0f0f15] border-white/5 text-zinc-400 hover:text-zinc-200 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold ${
                          isActive
                            ? 'bg-[#00e5ff] text-[#08080a]'
                            : 'bg-[#181824] text-zinc-400'
                        }`}
                      >
                        {v.id}
                      </div>
                      <span className="text-xs font-bold font-mono tracking-wider">
                        {v.roleLabel}
                      </span>
                    </div>

                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      className={`transition-transform duration-200 ${
                        isActive ? 'translate-x-1 text-[#00e5ff]' : 'text-zinc-600'
                      }`}
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Quote Display Card */}
          <div className="lg:col-span-7 flex">
            <div className="w-full bg-[#0d0d14] border border-white/15 rounded-2xl p-7 sm:p-9 shadow-2xl flex flex-col justify-between backdrop-blur-md relative">
              {/* Window Bar Header */}
              <div className="flex items-center justify-between pb-6 border-b border-white/10 mb-6">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                  <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
                  <span className="text-xs font-mono text-zinc-400 ml-2">
                    VOICES / {activeVoice.id}
                  </span>
                </div>

                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono font-bold">
                  <span>✓</span>
                  <span>PRODUCTION</span>
                </div>
              </div>

              {/* Quote Content */}
              <div className="flex-1 flex flex-col justify-center my-4">
                <p className="text-base sm:text-xl lg:text-2xl text-zinc-100 font-medium leading-relaxed italic mb-8">
                  &ldquo;{activeVoice.quote}&rdquo;
                </p>

                {/* Metric Highlight */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#141420] border border-white/10 text-xs font-mono text-[#00e5ff] self-start mb-6">
                  <span>✦</span>
                  <span>{activeVoice.metric}</span>
                </div>
              </div>

              {/* Author Footer */}
              <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-white">
                    {activeVoice.author}
                  </h4>
                  <p className="text-xs text-zinc-400">
                    {activeVoice.title} · <span className="text-[#00e5ff]">{activeVoice.company}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveIndex((prev) => (prev > 0 ? prev - 1 : VOICES.length - 1))
                    }
                    className="w-9 h-9 rounded-lg bg-[#181824] hover:bg-[#202030] border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-all cursor-pointer"
                    aria-label="Previous testimonial"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveIndex((prev) => (prev < VOICES.length - 1 ? prev + 1 : 0))
                    }
                    className="w-9 h-9 rounded-lg bg-[#181824] hover:bg-[#202030] border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-all cursor-pointer"
                    aria-label="Next testimonial"
                  >
                    →
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
