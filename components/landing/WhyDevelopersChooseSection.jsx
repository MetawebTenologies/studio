'use client';

import React from 'react';
import { TIMECAPSULE_BRAND } from '@/branding';

export default function WhyDevelopersChooseSection() {
  return (
    <section className="py-20 sm:py-28 bg-[#08080a] border-b border-white/5 relative">
      <div className="max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#00e5ff]/10 border border-[#00e5ff]/30 text-[#00e5ff] text-[11px] font-bold uppercase tracking-wider mb-4">
            WHY CHOOSE {TIMECAPSULE_BRAND.name.toUpperCase()}
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#f5f7fa] tracking-tight mb-4">
            Why Developers Choose{' '}
            <span className="bg-gradient-to-r from-[#00e5ff] to-[#38bdf8] bg-clip-text text-transparent">
              {TIMECAPSULE_BRAND.name}
            </span>
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed max-w-2xl mx-auto">
            We abstract away the complexity of handling multiple generation platforms, so you can focus entirely on building your application.
          </p>
        </div>

        {/* 6 Alternating Feature Blocks */}
        <div className="space-y-20 lg:space-y-28">

          {/* Block 1: Lower-Cost Access (Cost Efficiency) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            <div className="lg:col-span-6 space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-bold font-mono tracking-wider text-[#00e5ff] uppercase">
                <span className="w-6 h-6 rounded-md bg-[#00e5ff]/10 border border-[#00e5ff]/30 flex items-center justify-center text-[#00e5ff] text-xs">
                  $
                </span>
                COST EFFICIENCY
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-[#f5f7fa] tracking-tight">
                Lower-Cost Access to Leading Models
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {TIMECAPSULE_BRAND.name} gives you lower-cost access to leading AI models through a flexible credit-based system. Compared with official APIs and marketplaces, many models are priced around 30% lower, while selected high-demand models can offer 60–70% savings.
              </p>
            </div>

            <div className="lg:col-span-6">
              <div className="bg-[#0e0e14] border border-white/10 rounded-2xl p-6 sm:p-7 shadow-xl">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold block mb-5">
                  PRICE COMPARISON
                </span>
                
                {/* Standard API Bar */}
                <div className="space-y-2 mb-5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-zinc-400">Standard API</span>
                    <span className="font-bold text-white">$0.30 <span className="text-zinc-500 font-normal">/generation</span></span>
                  </div>
                  <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="w-[100%] h-full bg-[#ef4444] rounded-full" />
                  </div>
                </div>

                {/* Timecapsule Bar */}
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-zinc-300 font-bold">{TIMECAPSULE_BRAND.name}</span>
                    <span className="font-bold text-[#00e5ff]">$0.09 <span className="text-zinc-500 font-normal">/generation</span></span>
                  </div>
                  <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="w-[30%] h-full bg-gradient-to-r from-[#10b981] to-[#00e5ff] rounded-full shadow-[0_0_10px_rgba(0,229,255,0.5)]" />
                  </div>
                </div>

                {/* Savings Pill */}
                <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-mono">
                    ↓ 70% Savings
                  </span>
                  <span className="text-xs text-zinc-400">on selected high-demand models</span>
                </div>
              </div>
            </div>
          </div>

          {/* Block 2: One API for 30+ AI Models (Reversed) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            <div className="lg:col-span-6 order-2 lg:order-1">
              <div className="bg-[#0e0e14] border border-white/10 rounded-2xl p-6 sm:p-7 shadow-xl">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold block mb-4">
                  UNIFIED API GATEWAY
                </span>

                <div className="w-full py-3 px-4 rounded-xl bg-[#161622] border border-white/10 font-mono text-xs text-center text-zinc-200 mb-4 shadow-sm flex items-center justify-center gap-2">
                  <span className="text-[#00e5ff] font-bold">POST</span>
                  <span>/api/v1/run</span>
                </div>

                {/* Downward Bus Arrow */}
                <div className="flex justify-center mb-4">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <polyline points="19 12 12 19 5 12" />
                  </svg>
                </div>

                {/* Model Grid */}
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { name: 'Veo 3', border: 'border-blue-500/30 bg-blue-500/5 text-blue-400' },
                    { name: 'Flux', border: 'border-amber-500/30 bg-amber-500/5 text-amber-400' },
                    { name: 'Runway', border: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400' },
                    { name: 'GPT-4o', border: 'border-teal-500/30 bg-teal-500/5 text-teal-400' },
                    { name: 'Claude', border: 'border-orange-500/30 bg-orange-500/5 text-orange-400' },
                    { name: 'Suno', border: 'border-purple-500/30 bg-purple-500/5 text-purple-400' },
                  ].map((m) => (
                    <div key={m.name} className={`p-2.5 rounded-lg border text-center text-xs font-mono font-bold ${m.border}`}>
                      {m.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-4 order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 text-xs font-bold font-mono tracking-wider text-[#00e5ff] uppercase">
                <span className="w-6 h-6 rounded-md bg-[#00e5ff]/10 border border-[#00e5ff]/30 flex items-center justify-center text-[#00e5ff]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                  </svg>
                </span>
                UNIFIED API
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-[#f5f7fa] tracking-tight">
                One API for 30+ Certified AI Models
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Access video, image, audio, and multimodal foundation models through one unified API. Switch between Veo, Flux, Seedance, Runway, Claude, GPT, and Gemini without rebuilding your backend infrastructure.
              </p>
            </div>
          </div>

          {/* Block 3: 99.9% Availability (Reliability) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            <div className="lg:col-span-6 space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-bold font-mono tracking-wider text-[#00e5ff] uppercase">
                <span className="w-6 h-6 rounded-md bg-[#00e5ff]/10 border border-[#00e5ff]/30 flex items-center justify-center text-[#00e5ff]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                    <polyline points="17 6 23 6 23 12" />
                  </svg>
                </span>
                RELIABILITY
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-[#f5f7fa] tracking-tight">
                99.9% Availability. 24/7 Monitoring
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                {TIMECAPSULE_BRAND.name} keeps high-volume AI generation workflows moving with monitored API availability, around-the-clock task monitoring, async task tracking, webhook callbacks, and circuit-breaker protection across all supported models.
              </p>
            </div>

            <div className="lg:col-span-6">
              <div className="bg-[#0e0e14] border border-white/10 rounded-2xl p-6 sm:p-7 shadow-xl">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold block mb-4">
                  SYSTEM STATUS
                </span>

                <div className="flex items-baseline gap-6 mb-6">
                  <div>
                    <span className="text-3xl sm:text-4xl font-black text-[#10b981] font-mono">99.9%</span>
                    <span className="text-[11px] font-mono uppercase text-zinc-500 block">Uptime (30 Days)</span>
                  </div>
                  <div>
                    <span className="text-2xl sm:text-3xl font-black text-white font-mono">~120ms</span>
                    <span className="text-[11px] font-mono uppercase text-zinc-500 block">Avg Response</span>
                  </div>
                </div>

                {/* 30 Day Uptime Bars */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1 sm:gap-1.5 h-6">
                    {Array.from({ length: 30 }).map((_, i) => (
                      <div
                        key={i}
                        className={`flex-1 h-full rounded-sm ${
                          i === 18 ? 'bg-amber-400' : 'bg-[#10b981]'
                        } opacity-90 hover:opacity-100 transition-opacity`}
                        title={`Day ${i + 1}: ${i === 18 ? '99.2%' : '100%'} uptime`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                    <span>30 days ago</span>
                    <span>Today</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Block 4: Webhook & Polling Support (Event-Driven - Reversed) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            <div className="lg:col-span-6 order-2 lg:order-1">
              <div className="bg-[#0e0e14] border border-white/10 rounded-2xl p-6 shadow-xl font-mono text-xs">
                <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-bold block mb-4">
                  WEBHOOK DELIVERY LOG
                </span>

                <div className="space-y-2 mb-4">
                  {[
                    { time: '14:32:01', endpoint: '/webhook', taskId: 'task_a1b2c3', code: '200', ms: '89ms' },
                    { time: '14:31:47', endpoint: '/webhook', taskId: 'task_d4e5f6', code: '200', ms: '112ms' },
                    { time: '14:31:22', endpoint: '/webhook', taskId: 'task_g7h8i9', code: '200', ms: '95ms' },
                  ].map((row) => (
                    <div key={row.taskId} className="flex items-center justify-between p-2.5 rounded-lg bg-[#14141e] border border-white/5 text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-500">{row.time}</span>
                        <span className="text-[#00e5ff] font-bold">POST</span>
                        <span className="text-zinc-300">{row.endpoint}</span>
                        <span className="text-zinc-500 hidden sm:inline">{row.taskId}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                          {row.code}
                        </span>
                        <span className="text-zinc-400">{row.ms}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-[11px] text-zinc-400 pt-2 border-t border-white/5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Live — Instant delivery on task completion</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-4 order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 text-xs font-bold font-mono tracking-wider text-[#00e5ff] uppercase">
                <span className="w-6 h-6 rounded-md bg-[#00e5ff]/10 border border-[#00e5ff]/30 flex items-center justify-center text-[#00e5ff]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </span>
                EVENT-DRIVEN
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-[#f5f7fa] tracking-tight">
                Webhook &amp; Polling Support
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Provide a webhook URL to be notified instantly when media is ready, or use standard status polling and Server-Sent Events (SSE) based on your architectural needs. Both patterns are supported out of the box.
              </p>
            </div>
          </div>

          {/* Block 5: Simple AI API Integration (Developer Experience) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            <div className="lg:col-span-6 space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-bold font-mono tracking-wider text-[#00e5ff] uppercase">
                <span className="w-6 h-6 rounded-md bg-[#00e5ff]/10 border border-[#00e5ff]/30 flex items-center justify-center text-[#00e5ff]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                  </svg>
                </span>
                DEVELOPER EXPERIENCE
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-[#f5f7fa] tracking-tight">
                Simple AI API Integration
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Integrate once and access leading models across video, image, audio, and multimodal pipelines. With clear documentation, unified task flows, and consistent API patterns, your team can switch models by changing a single parameter.
              </p>
            </div>

            <div className="lg:col-span-6">
              <div className="bg-[#0e0e14] border border-white/10 rounded-2xl p-6 sm:p-7 shadow-xl">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold block mb-4">
                  SWITCH MODELS INSTANTLY
                </span>

                <div className="p-4 rounded-xl bg-[#09090d] border border-white/10 font-mono text-xs sm:text-[13px] space-y-2 mb-4">
                  <div className="text-red-400 bg-red-500/10 p-2 rounded border border-red-500/20">
                    <span className="text-red-500 font-bold mr-2">-</span>
                    {'{ model: "veo3-text-to-video" }'}
                  </div>
                  <div className="text-emerald-400 bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
                    <span className="text-emerald-500 font-bold mr-2">+</span>
                    {'{ model: "seedance-2-text-to-video" }'}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-zinc-300">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Same endpoint. Same response format. Zero code changes.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Block 6: Robust Data Security (Enterprise Security - Reversed) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            <div className="lg:col-span-6 order-2 lg:order-1">
              <div className="bg-[#0e0e14] border border-white/10 rounded-2xl p-6 shadow-xl space-y-3">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold block mb-2">
                  SECURITY ARCHITECTURE
                </span>

                {[
                  { title: 'TLS 1.3 Encryption', desc: 'All API traffic encrypted in transit' },
                  { title: 'API Key Authentication', desc: 'Secure per-project credential isolation' },
                  { title: 'Sandboxed Processing', desc: 'Task data isolated per request lifecycle' },
                  { title: 'Auto-Purge Policy', desc: 'Temporary assets purged after delivery' },
                ].map((item) => (
                  <div key={item.title} className="flex items-center justify-between p-3 rounded-lg bg-[#14141e] border border-white/5">
                    <div>
                      <h4 className="text-xs font-bold text-white mb-0.5">{item.title}</h4>
                      <p className="text-[11px] text-zinc-400">{item.desc}</p>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" className="shrink-0">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-6 space-y-4 order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 text-xs font-bold font-mono tracking-wider text-[#00e5ff] uppercase">
                <span className="w-6 h-6 rounded-md bg-[#00e5ff]/10 border border-[#00e5ff]/30 flex items-center justify-center text-[#00e5ff]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </span>
                ENTERPRISE SECURITY
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-[#f5f7fa] tracking-tight">
                Robust Data Security
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Secure API authentication, encrypted requests, and controlled task handling help protect your prompts, assets, and generation results across production workflows.
              </p>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
