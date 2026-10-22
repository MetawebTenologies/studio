'use client';

import { useState } from 'react';
import Link from 'next/link';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import BrandIcon from '@/components/BrandIcon';
import { Button, Badge, Card } from '@/components/ui';

const LEFT_PROVIDERS = [
  { name: 'Kling AI', slug: 'kling', id: 'kling-2-1-pro' },
  { name: 'Runway Gen-3', slug: 'runway', id: 'runway-gen3' },
  { name: 'Luma AI', slug: 'luma', id: 'luma-dream-machine' },
  { name: 'Pika AI', slug: 'pika', id: 'pika-2.0' },
  { name: 'WanX 2.1', slug: 'wanx', id: 'wanx-2.1' },
  { name: 'Hunyuan', slug: 'hunyuan', id: 'hunyuan-video' },
  { name: 'Google Veo 3.1', slug: 'veo', id: 'veo3.1-fast-text-to-video' },
  { name: 'PixVerse AI', slug: 'pixverse', id: 'pixverse-v3' },
  { name: 'Vidu AI', slug: 'vidu', id: 'vidu-ai' },
  { name: 'Hailuo AI', slug: 'minimax', id: 'minimax-hailuo' },
];

const RIGHT_PROVIDERS = [
  { name: 'Flux Schnell', slug: 'flux', id: 'flux-schnell' },
  { name: 'Nano Banana Pro', slug: 'banana', id: 'nano-banana-pro' },
  { name: 'Seedance 2.5', slug: 'seedance', id: 'seedance-pro-t2v' },
  { name: 'MiniMax Audio', slug: 'minimax', id: 'minimax-audio' },
  { name: 'HiDream-i1', slug: 'hidream', id: 'hidream-i1' },
  { name: 'Ideogram v4', slug: 'ideogram', id: 'ideogram-v4' },
  { name: 'Google Imagen 3', slug: 'imagen', id: 'google-imagen-3' },
  { name: 'GPT Image 1', slug: 'gpt', id: 'gpt-image-1' },
  { name: 'Qwen Image', slug: 'qwen', id: 'qwen-image-edit' },
  { name: 'Wan 2.2 Speech', slug: 'wanx', id: 'wan-2.2-speech' },
];

const FEATURED_MODELS = [
  {
    id: 'nano-banana-pro',
    name: 'Nano Banana Pro',
    slug: 'banana',
    category: 'TEXT TO IMAGE',
    rate: '$0.015 / gen',
    latency: '1.2s avg',
    desc: 'High-speed generative photorealism with 1K/2K resolution synthesis and prompt fidelity.',
  },
  {
    id: 'seedance-pro-t2v',
    name: 'Seedance Pro T2V',
    slug: 'seedance',
    category: 'TEXT TO VIDEO',
    rate: '$0.120 / 5s',
    latency: '8.4s avg',
    desc: 'Ultra-smooth cinematic camera motion and temporal coherence with 720p/1080p generation.',
  },
  {
    id: 'veo3.1-fast-text-to-video',
    name: 'Google Veo 3.1 Fast',
    slug: 'veo',
    category: 'TEXT TO VIDEO',
    rate: '$0.600 / 8s',
    latency: '11.8s avg',
    desc: 'DeepMind video generation engine with 8-second cinematic landscape pacing.',
  },
  {
    id: 'flux-dev',
    name: 'Flux Dev',
    slug: 'flux',
    category: 'TEXT TO IMAGE',
    rate: '$0.015 / gen',
    latency: '2.1s avg',
    desc: 'Black Forest Labs state-of-the-art open weights model with detailed visual rendering.',
  },
  {
    id: 'kling-2-1-pro',
    name: 'Kling 2.1 Pro',
    slug: 'kling',
    category: 'TEXT TO VIDEO',
    rate: '$0.170 / 5s',
    latency: '14.2s avg',
    desc: 'High-dynamic physical simulation for realistic complex scene and character action.',
  },
  {
    id: 'qwen-image-edit',
    name: 'Qwen Image Edit',
    slug: 'qwen',
    category: 'IMAGE EDITING',
    rate: '$0.009 / gen',
    latency: '1.5s avg',
    desc: 'Natural language image inpainting, object removal, and lighting transformations.',
  },
];

export default function HomePage() {
  const [hoveredModel, setHoveredModel] = useState(null);

  return (
    <div className="min-h-screen bg-[#08080a] text-[#f5f7fa] flex flex-col font-sans selection:bg-[#00e5ff] selection:text-[#08080a]">
      {/* Top Studio Notification Strip */}
      <div className="bg-[#0c0c10] border-b border-white/10 text-xs font-medium py-2 px-4 text-center flex items-center justify-center gap-4 flex-wrap text-zinc-300">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00e5ff] animate-pulse" />
          Seedance 2.5 4K Cinema is live
        </span>
        <Link href="/explore" className="text-[#00e5ff] underline hover:text-[#38bdf8] font-semibold">
          Explore Studio →
        </Link>
        <span className="opacity-30">|</span>
        <span>• Google Veo 3.1 Fast Dedicated Route</span>
        <Link href="/veo3.1-fast-text-to-video" className="text-[#00e5ff] underline hover:text-[#38bdf8] font-semibold">
          Try now
        </Link>
        <span className="opacity-30">|</span>
        <span>• FLUX 3 Klein Inpainting</span>
        <Link href="/explore" className="text-[#00e5ff] underline hover:text-[#38bdf8] font-semibold">
          Open Studio →
        </Link>
      </div>

      {/* Main Platform Navigation (Clean Header Without Internal Subnav Strip) */}
      <PlatformNav activeModule="home" showSubnav={false} />

      <main className="flex-1 flex flex-col">
        {/* =========================================================================
            Hero Section: Neural Circuit Bus Architecture (Muapi-Parity Layout)
            ========================================================================= */}
        <section className="relative overflow-hidden py-14 sm:py-20 lg:py-24 border-b border-white/10 bg-[#08080a]">
          {/* Subtle Cybernetic Background Atmosphere */}
          <div className="absolute inset-0 pointer-events-none select-none">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,_rgba(0,229,255,0.07)_0%,_rgba(155,140,255,0.03)_35%,_transparent_70%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />
          </div>

          <div className="relative z-10 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Left Model Circuit Rail (Right-Aligned, Clean Text + Brand Icon) */}
              <div className="max-lg:hidden lg:col-span-3 flex flex-col gap-3.5 pr-2">
                {LEFT_PROVIDERS.map((item, idx) => {
                  const isHovered = hoveredModel === item.name;
                  return (
                    <Link
                      key={item.name}
                      href={`/${item.id}`}
                      onMouseEnter={() => setHoveredModel(item.name)}
                      onMouseLeave={() => setHoveredModel(null)}
                      className="group flex items-center justify-end gap-3 transition-all duration-200 cursor-pointer select-none"
                    >
                      <span
                        className={`text-xs font-bold tracking-tight transition-colors duration-200 ${
                          isHovered
                            ? 'text-[#00e5ff] drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]'
                            : 'text-zinc-300 group-hover:text-white'
                        }`}
                      >
                        {item.name}
                      </span>
                      <span
                        className={`w-7 h-7 rounded-md border flex items-center justify-center transition-all duration-200 ${
                          isHovered
                            ? 'bg-[#00e5ff]/20 border-[#00e5ff] text-[#00e5ff] shadow-[0_0_12px_rgba(0,229,255,0.3)]'
                            : 'bg-[#121217] border-white/10 text-zinc-400 group-hover:text-[#00e5ff] group-hover:border-white/20'
                        }`}
                      >
                        <BrandIcon name={item.slug} className="w-3.5 h-3.5" />
                      </span>

                      {/* SVG Circuit Connector Line Flowing Inward */}
                      <svg className="w-16 lg:w-24 h-5 shrink-0 overflow-visible" viewBox="0 0 80 20" fill="none">
                        <path
                          d={
                            idx <= 2
                              ? 'M0 10 H30 L45 16 H75'
                              : idx >= 7
                              ? 'M0 10 H30 L45 4 H75'
                              : 'M0 10 H75'
                          }
                          stroke={isHovered ? '#00e5ff' : 'rgba(255,255,255,0.14)'}
                          strokeWidth={isHovered ? '2' : '1.25'}
                          strokeLinecap="round"
                          className="transition-colors duration-200"
                        />
                        <circle
                          cx="75"
                          cy={idx <= 2 ? '16' : idx >= 7 ? '4' : '10'}
                          r={isHovered ? '3' : '2'}
                          fill={isHovered ? '#00e5ff' : 'rgba(255,255,255,0.25)'}
                          className="transition-all duration-200"
                        />
                      </svg>
                    </Link>
                  );
                })}
              </div>

              {/* Center Core Hero Gateway (High-Contrast, Authoritative Typography) */}
              <div className="lg:col-span-6 text-center px-2 sm:px-4 flex flex-col items-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00e5ff]/10 border border-[#00e5ff]/30 text-[#00e5ff] text-[11px] font-bold uppercase tracking-wider mb-6">
                  <span className="w-2 h-2 rounded-full bg-[#00e5ff] animate-ping" />
                  Direct Multi-Provider AI Gateway
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-black tracking-tight text-[#f5f7fa] leading-[1.1] mb-5">
                  One API for{' '}
                  <span className="bg-gradient-to-r from-[#00e5ff] via-[#38bdf8] to-[#c084fc] bg-clip-text text-transparent">
                    All AI Models
                  </span>
                </h1>

                <p className="text-sm sm:text-base text-zinc-300 max-w-lg mx-auto leading-relaxed mb-8">
                  Lowest cost multi-provider API for generative video, photorealistic images, and audio synthesis with zero vendor lock-in.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md mb-8">
                  <Link
                    href="/explore"
                    className="w-full sm:w-auto px-7 py-3 rounded-full bg-[#00e5ff] hover:bg-[#38bdf8] text-[#08080a] font-extrabold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(0,229,255,0.3)] hover:shadow-[0_0_25px_rgba(0,229,255,0.5)] cursor-pointer text-center"
                  >
                    Start Building
                  </Link>
                  <Link
                    href="/docs"
                    className="w-full sm:w-auto px-7 py-3 rounded-full bg-[#121217] hover:bg-[#181820] border border-white/20 text-[#f5f7fa] hover:border-white/40 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer text-center"
                  >
                    Read Documentation
                  </Link>
                </div>

                {/* Sub-Headline Trust Metric Chips */}
                <div className="flex items-center justify-center gap-4 text-[11px] font-mono text-zinc-400 flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Fail-Closed Safety
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00e5ff]" />
                    Double-Entry Ledger
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    Multi-Tenant RLS
                  </span>
                </div>
              </div>

              {/* Right Model Circuit Rail (Left-Aligned, Brand Icon + Clean Text) */}
              <div className="max-lg:hidden lg:col-span-3 flex flex-col gap-3.5 pl-2">
                {RIGHT_PROVIDERS.map((item, idx) => {
                  const isHovered = hoveredModel === item.name;
                  return (
                    <Link
                      key={item.name}
                      href={`/${item.id}`}
                      onMouseEnter={() => setHoveredModel(item.name)}
                      onMouseLeave={() => setHoveredModel(null)}
                      className="group flex items-center justify-start gap-3 transition-all duration-200 cursor-pointer select-none"
                    >
                      {/* SVG Circuit Connector Line Flowing Outward */}
                      <svg className="w-16 lg:w-24 h-5 shrink-0 overflow-visible" viewBox="0 0 80 20" fill="none">
                        <circle
                          cx="5"
                          cy={idx <= 2 ? '16' : idx >= 7 ? '4' : '10'}
                          r={isHovered ? '3' : '2'}
                          fill={isHovered ? '#00e5ff' : 'rgba(255,255,255,0.25)'}
                          className="transition-all duration-200"
                        />
                        <path
                          d={
                            idx <= 2
                              ? 'M5 16 H35 L50 10 H80'
                              : idx >= 7
                              ? 'M5 4 H35 L50 10 H80'
                              : 'M5 10 H80'
                          }
                          stroke={isHovered ? '#00e5ff' : 'rgba(255,255,255,0.14)'}
                          strokeWidth={isHovered ? '2' : '1.25'}
                          strokeLinecap="round"
                          className="transition-colors duration-200"
                        />
                      </svg>

                      <span
                        className={`w-7 h-7 rounded-md border flex items-center justify-center transition-all duration-200 ${
                          isHovered
                            ? 'bg-[#00e5ff]/20 border-[#00e5ff] text-[#00e5ff] shadow-[0_0_12px_rgba(0,229,255,0.3)]'
                            : 'bg-[#121217] border-white/10 text-zinc-400 group-hover:text-[#00e5ff] group-hover:border-white/20'
                        }`}
                      >
                        <BrandIcon name={item.slug} className="w-3.5 h-3.5" />
                      </span>
                      <span
                        className={`text-xs font-bold tracking-tight transition-colors duration-200 ${
                          isHovered
                            ? 'text-[#00e5ff] drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]'
                            : 'text-zinc-300 group-hover:text-white'
                        }`}
                      >
                        {item.name}
                      </span>
                    </Link>
                  );
                })}
              </div>

            </div>
          </div>
        </section>

        {/* Feature Stat Strip (Exact Muapi Parity: 500+ All models in one API, no subscription...) */}
        <section className="bg-[#0c0c10] border-b border-white/10 py-3.5 px-4">
          <div className="max-w-[1400px] w-full mx-auto flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-xs font-semibold text-zinc-300">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00e5ff]" />
              <strong className="text-white">600+</strong> All models in one API
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Pay-per-second precision · No monthly lock-in
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Automatic refund on failed tasks
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#c084fc]" />
              Up to 60% lower rates vs direct provider retail
            </span>
          </div>
        </section>

        {/* =========================================================================
            Production Model Providers Section (Clean Pill Architecture)
            ========================================================================= */}
        <section className="py-16 sm:py-20 bg-[#08080a] border-b border-white/5">
          <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#00e5ff] font-mono">
                TOP MODEL ECOSYSTEMS, ONE API
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#f5f7fa] tracking-tight mt-2 mb-3">
                Production Model Providers on Timecapsule
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                The fastest way to experiment, build, and deploy generative AI apps. Access 25+ integrated provider gateways.
              </p>
            </div>

            {/* Provider Pill Chips with Monochrome Brand Logos */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-4xl mx-auto mb-10">
              {[
                { name: 'OpenAI', slug: 'openai' },
                { name: 'Google DeepMind', slug: 'google' },
                { name: 'Kling AI', slug: 'kling' },
                { name: 'ByteDance', slug: 'bytedance' },
                { name: 'Black Forest Labs', slug: 'flux' },
                { name: 'MiniMax', slug: 'minimax' },
                { name: 'Alibaba Qwen', slug: 'qwen' },
                { name: 'Stability AI', slug: 'stability' },
                { name: 'Runway', slug: 'runway' },
                { name: 'Luma AI', slug: 'luma' },
              ].map((p) => (
                <div
                  key={p.name}
                  className="group flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#121217] border border-white/10 hover:border-[#00e5ff]/50 hover:bg-[#181820] hover:shadow-[0_0_12px_rgba(0,229,255,0.1)] transition-all cursor-default select-none"
                >
                  <span className="w-4 h-4 flex items-center justify-center text-zinc-400 group-hover:text-[#00e5ff] transition-colors">
                    <BrandIcon name={p.slug} className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-xs font-semibold text-zinc-300 group-hover:text-white transition-colors">
                    {p.name}
                  </span>
                </div>
              ))}
            </div>

            {/* Provider Action Buttons */}
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link
                href="/explore"
                className="px-6 py-2.5 bg-[#00e5ff] hover:bg-[#38bdf8] text-[#08080a] rounded-full text-xs font-extrabold uppercase tracking-wider transition-colors shadow-sm"
              >
                Start Building
              </Link>
              <Link
                href="/docs"
                className="px-6 py-2.5 bg-[#121217] border border-white/15 hover:border-white/30 text-zinc-200 hover:text-white rounded-full text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Read Documentation
              </Link>
              <Link
                href="/providers"
                className="px-6 py-2.5 text-[#00e5ff] hover:underline text-xs font-bold uppercase tracking-wider transition-colors"
              >
                View all providers →
              </Link>
            </div>
          </div>
        </section>

        {/* =========================================================================
            Curated Foundation Models Showcase (Direct Interactive Access)
            ========================================================================= */}
        <section className="py-16 sm:py-20 bg-[#09090b]">
          <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 pb-4 border-b border-white/10">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#00e5ff] font-mono">
                  CURATED WORKSPACE
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-[#f5f7fa] tracking-tight mt-1">
                  Featured Generative Endpoints
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                  Ready-to-use models with in-place sandbox playgrounds and production API snippets.
                </p>
              </div>

              <Link
                href="/explore"
                className="self-start sm:self-auto px-4 py-2 rounded-lg bg-[#121217] hover:bg-[#181820] border border-white/10 text-xs font-bold text-zinc-200 hover:text-[#00e5ff] transition-all"
              >
                View All 600+ Models →
              </Link>
            </div>

            {/* 6-Card Foundation Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURED_MODELS.map((model) => (
                <Card
                  key={model.id}
                  className="p-5 flex flex-col justify-between hover:border-[#00e5ff]/50 hover:shadow-[0_0_20px_rgba(0,229,255,0.08)] transition-all group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-md bg-[#181820] border border-white/10 flex items-center justify-center text-zinc-300 group-hover:text-[#00e5ff] transition-colors">
                          <BrandIcon name={model.slug} className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-[#f5f7fa] group-hover:text-[#00e5ff] transition-colors">
                            {model.name}
                          </h3>
                          <span className="text-[10px] text-zinc-500 font-mono tracking-wider">
                            {model.category}
                          </span>
                        </div>
                      </div>
                      <Badge variant="default">
                        {model.latency}
                      </Badge>
                    </div>

                    <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                      {model.desc}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex items-center justify-between mt-2">
                    <div>
                      <span className="text-[10px] text-zinc-500 block uppercase font-mono">Rate</span>
                      <span className="text-xs font-bold font-mono text-[#00e5ff]">
                        {model.rate}
                      </span>
                    </div>

                    <Link
                      href={`/${model.id}`}
                      className="px-3.5 py-1.5 rounded-md bg-[#181820] hover:bg-[#00e5ff] hover:text-[#08080a] text-zinc-200 text-xs font-bold transition-all border border-white/10 hover:border-transparent"
                    >
                      Try in Studio →
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <PlatformFooter />
    </div>
  );
}
