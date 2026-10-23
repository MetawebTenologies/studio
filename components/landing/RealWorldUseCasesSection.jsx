'use client';

import React, { useState } from 'react';
import Link from 'next/link';

const USE_CASES = [
  {
    id: 'ecommerce',
    title: 'E-Commerce',
    summary: 'Generate production-ready assets for E-Commerce automatically. Scale your catalog photography with automated pipeline workflows.',
    features: [
      { name: 'Product Shots', desc: 'Studio-quality product photography with AI lighting.' },
      { name: 'Model Swap', desc: 'Change models and poses in product photos instantly.' },
    ],
    nodes: [
      { step: '01', label: 'Product Photo', tag: 'INPUT', icon: 'camera' },
      { step: '02', label: 'Remove BG', tag: 'SEGMENTATION', icon: 'scissors' },
      { step: '03', label: 'Scene Lighting', tag: 'INPAINT', icon: 'sun' },
      { step: '04', label: 'Model Swap', tag: 'SYNTHESIS', icon: 'user' },
      { step: '05', label: '4K Commercial', tag: 'OUTPUT', icon: 'check' },
    ],
    outputHighlight: 'Catalog Ready in 3.4s',
  },
  {
    id: 'fashion',
    title: 'Fashion & Apparel',
    summary: 'Generate high-fidelity lookbooks and virtual try-ons for fashion brands. Retain garment textures, drape, and logo fidelity seamlessly.',
    features: [
      { name: 'Design Generator', desc: 'Synthesize new clothing patterns and fabric textures.' },
      { name: 'Virtual Try-On', desc: 'Drape garments realistically on any avatar or model.' },
    ],
    nodes: [
      { step: '01', label: 'Flat Garment', tag: 'INPUT', icon: 'tag' },
      { step: '02', label: 'Pose Matching', tag: 'CONTROLNET', icon: 'crosshair' },
      { step: '03', label: 'Texture Warp', tag: 'DRAPE SIM', icon: 'layers' },
      { step: '04', label: 'Model Inpaint', tag: 'SYNTHESIS', icon: 'sparkles' },
      { step: '05', label: 'Runway Clip', tag: 'MOTION V2V', icon: 'film' },
    ],
    outputHighlight: 'Zero Photoshoot Overhead',
  },
  {
    id: 'social',
    title: 'Social & Short Form',
    summary: 'Automate high-volume short-form video production with viral audio sync, character consistency, and dynamic kinetic captions.',
    features: [
      { name: 'Viral Motion Hooks', desc: 'First-frame kinetic animation for maximum retention.' },
      { name: 'Lip-Sync Avatars', desc: 'Multilingual speech synchronization with natural cadence.' },
    ],
    nodes: [
      { step: '01', label: 'Script & Audio', tag: 'TTS / VO', icon: 'mic' },
      { step: '02', label: 'Character Lock', tag: 'FACE EMBED', icon: 'user' },
      { step: '03', label: 'Kling Motion', tag: 'I2V SYNC', icon: 'video' },
      { step: '04', label: 'Lip-Sync Engine', tag: 'WAV2LIP', icon: 'volume' },
      { step: '05', label: 'Reels / TikTok', tag: 'MP4 9:16', icon: 'share' },
    ],
    outputHighlight: '60s Short Produced in 18s',
  },
  {
    id: 'cinema',
    title: 'Cinema & Virtual Production',
    summary: 'Direct full cinematic sequences with camera path controls, multi-angle character locking, and 4K Dolby Vision grading.',
    features: [
      { name: 'Camera Orbit & Crane', desc: 'Direct 3D spatial camera movements and focal depth.' },
      { name: 'Scene Continuity', desc: 'Multi-reference image conditioning for visual coherence.' },
    ],
    nodes: [
      { step: '01', label: 'Storyboard Frame', tag: 'KEYFRAME', icon: 'grid' },
      { step: '02', label: 'Depth Extraction', tag: 'DEPTH MAP', icon: 'box' },
      { step: '03', label: 'Seedance 2.5', tag: 'CINEMATIC T2V', icon: 'film' },
      { step: '04', label: 'Veo 3.1 Upscale', tag: 'TEMPORAL 4K', icon: 'zap' },
      { step: '05', label: 'Final Master', tag: 'DCI 24FPS', icon: 'check' },
    ],
    outputHighlight: 'Hollywood Coherence at Scale',
  },
];

function RenderNodeIcon({ type }) {
  switch (type) {
    case 'camera':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      );
    case 'scissors':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="6" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <line x1="20" y1="4" x2="8.12" y2="15.88" />
          <line x1="14.47" y1="14.48" x2="20" y2="20" />
          <line x1="8.12" y1="8.12" x2="12" y2="12" />
        </svg>
      );
    case 'sun':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        </svg>
      );
    case 'user':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9b8cff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    case 'check':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      );
    case 'film':
    case 'video':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
          <line x1="7" y1="2" x2="7" y2="22" />
          <line x1="17" y1="2" x2="17" y2="22" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <line x1="2" y1="7" x2="7" y2="7" />
          <line x1="2" y1="17" x2="7" y2="17" />
          <line x1="17" y1="17" x2="22" y2="17" />
          <line x1="17" y1="7" x2="22" y2="7" />
        </svg>
      );
    default:
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
  }
}

export default function RealWorldUseCasesSection() {
  const [activeTab, setActiveTab] = useState(USE_CASES[0].id);
  const currentCase = USE_CASES.find((c) => c.id === activeTab) || USE_CASES[0];

  return (
    <section className="py-20 sm:py-28 bg-[#09090c] border-b border-white/5 relative">
      <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#9b8cff] font-mono">
            END-TO-END PIPELINES
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-[#f5f7fa] tracking-tight mt-2 mb-3">
            Real World Use Cases
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Explore how top teams are leveraging modular workflows to build production AI features with zero friction.
          </p>
        </div>

        {/* 2-Column Showcase Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Interactive Vertical Tabs & Case Details */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Category Selector Buttons */}
            <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
              {USE_CASES.map((uc) => {
                const isActive = uc.id === activeTab;
                return (
                  <button
                    key={uc.id}
                    onClick={() => setActiveTab(uc.id)}
                    className={`text-left px-5 py-3.5 rounded-xl transition-all flex items-center justify-between whitespace-nowrap cursor-pointer border ${
                      isActive
                        ? 'bg-[#181822] border-[#00e5ff]/50 shadow-[0_0_15px_rgba(0,229,255,0.12)]'
                        : 'bg-[#121217] border-white/5 hover:border-white/20 hover:bg-[#15151c] text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span className={`text-sm font-extrabold tracking-wide ${isActive ? 'text-white' : 'text-zinc-300'}`}>
                      {uc.title}
                    </span>
                    {isActive && (
                      <span className="w-1.5 h-6 rounded-full bg-[#00e5ff] hidden lg:block" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Active Case Summary Card */}
            <div className="bg-[#121217] border border-white/10 rounded-2xl p-6 shadow-xl">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#00e5ff] mb-2">
                ACTIVE DOMAIN • {currentCase.title.toUpperCase()}
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed mb-6">
                {currentCase.summary}
              </p>

              {/* Sub-features grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-white/10">
                {currentCase.features.map((feat) => (
                  <div key={feat.name} className="bg-[#181820] border border-white/5 rounded-xl p-3">
                    <div className="text-xs font-bold text-white mb-1 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]" />
                      {feat.name}
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug">
                      {feat.desc}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                  ✓ {currentCase.outputHighlight}
                </span>
                <Link
                  href="/workflows"
                  className="text-xs font-bold text-[#00e5ff] hover:text-[#38bdf8] flex items-center gap-1 hover:underline"
                >
                  Clone Workflow →
                </Link>
              </div>
            </div>

          </div>

          {/* Right Column: Visual Pipeline Canvas */}
          <div className="lg:col-span-7 bg-[#0c0c11] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden min-h-[460px] flex flex-col justify-between">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-xs font-mono font-bold text-zinc-300">
                  PIPELINE EXECUTION GRAPH
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#181820] text-zinc-400 border border-white/10">
                MULTI-STAGE • ZERO-LATENCY BFF
              </span>
            </div>

            {/* Stepper Node Chain */}
            <div className="flex flex-col gap-4 my-auto relative">
              {currentCase.nodes.map((node, index) => {
                const isLast = index === currentCase.nodes.length - 1;
                return (
                  <div key={node.step} className="flex items-center gap-4 relative group">
                    {/* Node connector line */}
                    {!isLast && (
                      <div className="absolute left-[23px] top-[42px] bottom-[-16px] w-[2px] bg-gradient-to-b from-[#00e5ff]/60 to-white/10 z-0" />
                    )}

                    {/* Step Icon Badge */}
                    <div className="w-12 h-12 rounded-xl bg-[#181820] border border-white/10 flex items-center justify-center shrink-0 z-10 group-hover:border-[#00e5ff]/60 transition-colors shadow-md">
                      <RenderNodeIcon type={node.icon} />
                    </div>

                    {/* Node Content Card */}
                    <div className="flex-1 bg-[#121217] hover:bg-[#16161f] border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between transition-colors shadow-sm">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold text-[#00e5ff]">
                            STEP {node.step}
                          </span>
                          <span className="text-xs font-bold text-white">
                            {node.label}
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          EXECUTION: {node.tag}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-zinc-400 hidden sm:inline">
                          SUCCESS
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Canvas Footer */}
            <div className="pt-4 border-t border-white/10 mt-6 flex items-center justify-between text-xs text-zinc-400">
              <span className="font-mono text-[11px]">
                Deterministic Provider Leases Enabled
              </span>
              <Link
                href="/explore"
                className="px-4 py-1.5 rounded-lg bg-[#00e5ff] text-[#08080a] font-bold text-xs hover:bg-[#38bdf8] transition-colors"
              >
                Test in Studio
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
