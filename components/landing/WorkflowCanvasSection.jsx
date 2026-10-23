'use client';

import React from 'react';
import Link from 'next/link';

export default function WorkflowCanvasSection() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28 bg-[#08080a] border-b border-white/5">
      {/* Background glow and subtle cyber grid */}
      <div className="absolute inset-0 pointer-events-none select-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[radial-gradient(ellipse_at_center,_rgba(0,229,255,0.06)_0%,_rgba(155,140,255,0.02)_50%,_transparent_75%)] blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-25" />
      </div>

      <div className="relative z-10 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#00e5ff] font-mono">
            PIPELINE ORCHESTRATION
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#f5f7fa] tracking-tight mt-2 mb-4">
            Build &amp; Scale <span className="bg-gradient-to-r from-[#00e5ff] via-[#38bdf8] to-[#9b8cff] bg-clip-text text-transparent">Generative AI Workflows</span>
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed max-w-2xl mx-auto">
            The fastest way to experiment, build, and deploy generative media pipelines. Connect multi-modal models into robust production graphs with durable queues.
          </p>

          <div className="mt-7 flex items-center justify-center gap-4">
            <Link
              href="/explore"
              className="inline-flex items-center justify-center px-7 py-3 bg-[#f5f7fa] hover:bg-white text-[#08080a] rounded-full text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_25px_rgba(0,229,255,0.3)] cursor-pointer"
            >
              Start Building
            </Link>
            <Link
              href="/workflows"
              className="inline-flex items-center justify-center px-7 py-3 bg-[#121217] hover:bg-[#181820] text-zinc-200 hover:text-white border border-white/10 hover:border-[#00e5ff]/40 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              Explore Workflows
            </Link>
          </div>
        </div>

        {/* Interactive Node Graph Canvas */}
        <div className="relative max-w-5xl mx-auto bg-[#0a0a0e]/80 border border-white/10 rounded-2xl p-6 sm:p-10 shadow-2xl backdrop-blur-sm overflow-hidden min-h-[380px] flex items-center justify-center">
          {/* Animated Connecting SVG Bezier Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none hidden md:block" viewBox="0 0 900 340" fill="none" preserveAspectRatio="none">
            <defs>
              <linearGradient id="curveGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.6" />
              </linearGradient>
              <linearGradient id="curveGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#9b8cff" stopOpacity="0.8" />
              </linearGradient>
            </defs>

            {/* Path 1: Node 1 (FLUX 2 PRO) to Node 2 (WAN 2.5) */}
            <path
              d="M 230 140 C 330 140, 310 90, 420 90"
              stroke="url(#curveGrad1)"
              strokeWidth="2"
              strokeDasharray="4 4"
              className="animate-pulse"
            />
            {/* Connection dots */}
            <circle cx="230" cy="140" r="4" fill="#00e5ff" />
            <circle cx="420" cy="90" r="4" fill="#38bdf8" />

            {/* Path 2: Node 2 (WAN 2.5) to Node 3 (VEO 3.1) */}
            <path
              d="M 580 90 C 660 90, 640 180, 720 180"
              stroke="url(#curveGrad2)"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            {/* Connection dots */}
            <circle cx="580" cy="90" r="4" fill="#38bdf8" />
            <circle cx="720" cy="180" r="4" fill="#9b8cff" />
          </svg>

          {/* Responsive Node Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 w-full relative z-10 items-center">
            
            {/* Node 1: FLUX 2 PRO */}
            <div className="bg-[#121217] border border-white/10 hover:border-[#00e5ff]/50 rounded-xl p-4 shadow-xl transition-all duration-300 group hover:-translate-y-1">
              <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#00e5ff]">
                  STEP 01 • IMAGE GEN
                </span>
                <span className="w-2 h-2 rounded-full bg-[#00e5ff] animate-ping" />
              </div>
              <div className="h-32 sm:h-36 rounded-lg bg-[#181820] border border-white/5 relative overflow-hidden flex flex-col justify-end p-3">
                <div className="absolute inset-0 bg-gradient-to-t from-[#08080a] via-transparent to-transparent z-10" />
                <div className="absolute inset-0 flex items-center justify-center opacity-40 group-hover:opacity-60 transition-opacity">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                <div className="relative z-20">
                  <div className="text-xs font-black text-white">FLUX 2 PRO</div>
                  <div className="text-[10px] text-zinc-400 font-mono">Character &amp; Scene Keyframe</div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                <span>1024x1024 • 1.2s</span>
                <span className="text-emerald-400 font-bold">$0.015</span>
              </div>
            </div>

            {/* Node 2: WAN 2.5 */}
            <div className="bg-[#121217] border border-white/10 hover:border-[#38bdf8]/50 rounded-xl p-4 shadow-xl transition-all duration-300 group hover:-translate-y-1 md:-translate-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#38bdf8]">
                  STEP 02 • MOTION DYNAMICS
                </span>
                <span className="w-2 h-2 rounded-full bg-[#38bdf8]" />
              </div>
              <div className="h-32 sm:h-36 rounded-lg bg-[#181820] border border-white/5 relative overflow-hidden flex flex-col justify-end p-3">
                <div className="absolute inset-0 bg-gradient-to-t from-[#08080a] via-transparent to-transparent z-10" />
                <div className="absolute inset-0 flex items-center justify-center opacity-40 group-hover:opacity-60 transition-opacity">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="1.5">
                    <polygon points="23 7 16 12 23 17 23 7" />
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                </div>
                <div className="relative z-20">
                  <div className="text-xs font-black text-white">WAN 2.5 I2V</div>
                  <div className="text-[10px] text-zinc-400 font-mono">Camera Push-In &amp; Motion Flow</div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                <span>720p 60fps • 8.1s</span>
                <span className="text-emerald-400 font-bold">$0.080</span>
              </div>
            </div>

            {/* Node 3: VEO 3.1 */}
            <div className="bg-[#121217] border border-white/10 hover:border-[#9b8cff]/50 rounded-xl p-4 shadow-xl transition-all duration-300 group hover:-translate-y-1 md:translate-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#9b8cff]">
                  STEP 03 • CINEMA MASTER
                </span>
                <span className="w-2 h-2 rounded-full bg-[#9b8cff]" />
              </div>
              <div className="h-32 sm:h-36 rounded-lg bg-[#181820] border border-white/5 relative overflow-hidden flex flex-col justify-end p-3">
                <div className="absolute inset-0 bg-gradient-to-t from-[#08080a] via-transparent to-transparent z-10" />
                <div className="absolute inset-0 flex items-center justify-center opacity-40 group-hover:opacity-60 transition-opacity">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9b8cff" strokeWidth="1.5">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <div className="relative z-20">
                  <div className="text-xs font-black text-white">VEO 3.1 CINEMA</div>
                  <div className="text-[10px] text-zinc-400 font-mono">4K Upscale &amp; Acoustic Scoring</div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                <span>4K Master • 11.4s</span>
                <span className="text-emerald-400 font-bold">$0.600</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
