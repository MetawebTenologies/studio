'use client';

import { useState } from 'react';
import Link from 'next/link';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import ModuleStatusBadge from '@/components/ModuleStatusBadge';

const COMPACT_MODELS = [
  {
    name: 'flux-3-klein-edit-image',
    type: 'Image to Image',
    thumb: '/assets/cinema/classic_anamorphic.webp',
  },
  {
    name: 'flux-3-klein-text-to-image',
    type: 'Text to Image',
    thumb: '/assets/cinema/70s_cinema_prime.webp',
  },
  {
    name: 'lyria-2',
    type: 'Text to Audio',
    thumb: '/assets/cinema/full_frame_cine_digital.webp',
  },
  {
    name: 'lyria-3',
    type: 'Text to Audio',
    thumb: '/assets/cinema/modular_8k_digital.webp',
  },
];

const LATEST_MODELS = [
  {
    name: 'flux-3-klein-edit-image',
    type: 'Image to Image',
    thumb: '/assets/cinema/classic_anamorphic.webp',
  },
  {
    name: 'flux-3-klein-text-to-image',
    type: 'Text to Image',
    thumb: '/assets/cinema/70s_cinema_prime.webp',
  },
  {
    name: 'lyria-2',
    type: 'Text to Audio',
    thumb: '/assets/cinema/full_frame_cine_digital.webp',
  },
  {
    name: 'lyria-3',
    type: 'Text to Audio',
    thumb: '/assets/cinema/modular_8k_digital.webp',
  },
];

export default function DashboardPage() {
  const [showGettingStarted, setShowGettingStarted] = useState(true);
  const [activeTab, setActiveTab] = useState('latest');

  return (
    <div className="min-h-screen bg-[#070709] text-white flex flex-col font-sans">
      <PlatformNav activeModule="dashboard" />

      <main className="max-w-[1440px] w-full mx-auto px-6 lg:px-8 py-8 flex-1 flex flex-col">
        {/* Top Header Row matching Muapi */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Dashboard
              </h1>
              <ModuleStatusBadge status="working" />
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Overview of your API usage and generation history
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <div className="flex items-center gap-2 bg-[#121217] border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-300">
              <span className="text-zinc-500">I want to</span>
              <span className="font-semibold text-white">create with AI</span>
              <span className="text-zinc-500 text-[10px]">▾</span>
            </div>

            <button
              onClick={() => setShowGettingStarted(!showGettingStarted)}
              className="bg-[#121217] hover:bg-[#181820] border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <span>{showGettingStarted ? '👁️ Hide' : '👁️ Show'} Getting Started</span>
            </button>
          </div>
        </div>

        {/* 3-Column Onboarding & Quick Start Card (Exact Muapi Layout) */}
        {showGettingStarted && (
          <div className="bg-[#111116] border border-zinc-800/80 rounded-2xl p-6 mb-8 grid grid-cols-1 lg:grid-cols-3 gap-8 divide-y lg:divide-y-0 lg:divide-x divide-zinc-800/60 shadow-xl">
            {/* Col 1: Welcome Checklist */}
            <div className="pt-2 lg:pt-0 pr-0 lg:pr-6">
              <h2 className="text-sm font-bold text-white mb-2">Welcome to Timecapsule!</h2>
              <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                Follow these steps to get the most out of your experience. If you run into any issues, reach out to us on Discord or GitHub—we're happy to help!
              </p>

              <div className="space-y-4 text-xs">
                {/* Step 1 */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-4 h-4 rounded-full border border-emerald-400 bg-emerald-400/20 flex items-center justify-center text-[10px] text-emerald-400 font-bold">
                      ✓
                    </span>
                    <span className="text-zinc-300 font-medium">Single-tenant preview</span>
                  </div>
                  <span className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                    Active
                  </span>
                </div>

                {/* Step 2 */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-4 h-4 rounded-full border border-zinc-700 bg-zinc-900 flex items-center justify-center text-[10px] text-zinc-500">
                      2
                    </span>
                    <span className="text-zinc-300 font-medium">Available balance</span>
                  </div>
                  <Link
                    href="/usage"
                    className="px-3 py-1 rounded-lg bg-white hover:bg-zinc-200 text-black text-xs font-bold transition-colors"
                  >
                    500 cr
                  </Link>
                </div>

                {/* Step 3 */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-4 h-4 rounded-full border border-zinc-700 bg-zinc-900 flex items-center justify-center text-[10px] text-zinc-500">
                      3
                    </span>
                    <span className="text-zinc-300 font-medium">Generate your first media</span>
                  </div>
                  <Link
                    href="/studio?preview=1"
                    className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
                  >
                    Explore
                  </Link>
                </div>
              </div>
            </div>

            {/* Col 2: Quick Start Actions (01 - 08) */}
            <div className="pt-6 lg:pt-0 px-0 lg:px-6">
              <h2 className="text-sm font-bold text-white mb-1">Quick start</h2>
              <p className="text-xs text-zinc-400 mb-4">Quick access to essential features and resources.</p>

              <div className="space-y-2 text-xs">
                {[
                  { num: '01', label: 'Image Generator', badge: 'HOT', link: '/studio?preview=1', cta: 'Start Creating →' },
                  { num: '02', label: 'Video Generator', badge: 'HOT', link: '/studio?preview=1', cta: 'Start Creating →' },
                  { num: '03', label: 'Studio', link: '/studio?preview=1', cta: 'Open →' },
                  { num: '04', label: 'Workflows', link: '/workflows', cta: 'Build →' },
                  { num: '05', label: 'How to use the CLI/MCP', badge: 'NEW', link: '/cli', cta: 'Check →' },
                  { num: '06', label: 'Agent Skills', link: '/agents', cta: 'Explore →' },
                  { num: '07', label: 'White Label', link: '/white-label', cta: 'Setup →' },
                  { num: '08', label: 'API Keys', link: '/api-keys', cta: 'Manage →' },
                ].map((item) => (
                  <div key={item.num} className="flex items-center justify-between py-1 group">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-zinc-500 text-[11px]">{item.num}</span>
                      <span className="text-zinc-200 group-hover:text-white font-medium transition-colors">
                        {item.label}
                      </span>
                      {item.badge && (
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.2 rounded leading-tight ${
                            item.badge === 'HOT'
                              ? 'bg-amber-400 text-black'
                              : 'bg-purple-500 text-white'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <Link
                      href={item.link}
                      className="text-zinc-400 hover:text-blue-400 transition-colors text-[11px]"
                    >
                      {item.cta}
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Col 3: Explore Models Compact List */}
            <div className="pt-6 lg:pt-0 pl-0 lg:pl-6 flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-bold text-white mb-1">Explore models</h2>
                <p className="text-xs text-zinc-400 mb-4">Browse latest tools for image, video, and audio generation.</p>

                <div className="space-y-3">
                  {COMPACT_MODELS.map((m) => (
                    <Link
                      key={m.name}
                      href="/explore"
                      className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-zinc-800/40 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-zinc-900 border border-zinc-800">
                        <img src={m.thumb} alt={m.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                          {m.name}
                        </h3>
                        <p className="text-[11px] text-zinc-500">{m.type}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <Link
                href="/explore"
                className="text-xs font-semibold text-zinc-400 hover:text-white pt-4 flex items-center gap-1.5 transition-colors"
              >
                <span>⊞ View all models →</span>
              </Link>
            </div>
          </div>
        )}

        {/* 3 Metrics Cards (Exact Muapi Layout) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Card 1: Balance */}
          <div className="bg-[#111116] border border-zinc-800/80 rounded-xl p-6">
            <span className="text-xs text-zinc-400 block mb-1">Current credit balance</span>
            <div className="text-3xl font-black text-white font-mono mb-4">
              500 <span className="text-xs font-normal text-zinc-500">cr ($0.500)</span>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/usage"
                className="px-4 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black text-xs font-bold transition-colors"
              >
                Manage credits
              </Link>
              <Link
                href="/billing"
                className="px-4 py-1.5 rounded-lg bg-[#181820] hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-medium transition-colors"
              >
                Billing
              </Link>
            </div>
          </div>

          {/* Card 2: Requests in last 7 days */}
          <div className="bg-[#111116] border border-zinc-800/80 rounded-xl p-6">
            <span className="text-xs text-zinc-400 block mb-1">Requests in last 7 days</span>
            <div className="text-3xl font-black text-white font-mono mb-4">12</div>
            <Link
              href="/usage"
              className="inline-block px-3.5 py-1.5 rounded-lg bg-[#181820] hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-medium transition-colors"
            >
              Check history
            </Link>
          </div>

          {/* Card 3: Models Used */}
          <div className="bg-[#111116] border border-zinc-800/80 rounded-xl p-6">
            <span className="text-xs text-zinc-400 block mb-1">Models Used</span>
            <div className="text-3xl font-black text-white font-mono mb-4">3</div>
            <Link
              href="/usage"
              className="inline-block px-3.5 py-1.5 rounded-lg bg-[#181820] hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-medium transition-colors"
            >
              Check usage
            </Link>
          </div>
        </div>

        {/* Latest Models & Favourites Tabs Section (Exact Muapi Layout) */}
        <section className="mb-10">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3 mb-4">
            <div className="flex items-center gap-6">
              <button
                onClick={() => setActiveTab('latest')}
                className={`text-sm font-semibold relative transition-colors ${
                  activeTab === 'latest' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Latest Models
                {activeTab === 'latest' && (
                  <span className="absolute -bottom-3 left-0 right-0 h-0.5 bg-white rounded-full" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('favourites')}
                className={`text-sm font-semibold relative transition-colors ${
                  activeTab === 'favourites' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Favourites
                {activeTab === 'favourites' && (
                  <span className="absolute -bottom-3 left-0 right-0 h-0.5 bg-white rounded-full" />
                )}
              </button>
            </div>

            <Link
              href="/explore"
              className="border border-zinc-800 hover:border-zinc-700 px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white transition-colors"
            >
              View all models
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {LATEST_MODELS.map((m) => (
              <Link
                key={m.name}
                href="/explore"
                className="bg-[#111116] hover:bg-[#15151c] border border-zinc-800/80 hover:border-zinc-700 rounded-xl p-3 flex items-center gap-3 transition-all duration-150 group"
              >
                <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-zinc-900 border border-zinc-800">
                  <img src={m.thumb} alt={m.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                    {m.name}
                  </h3>
                  <p className="text-[11px] text-zinc-500">{m.type}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <PlatformFooter />
    </div>
  );
}
