'use client';

import Link from 'next/link';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';

const LEFT_PROVIDERS = [
  { name: 'Kling 2.1 Pro', icon: '🎬', category: 'Video' },
  { name: 'Runway Gen-3', icon: '🌀', category: 'Video' },
  { name: 'Luma Dream Machine', icon: '✨', category: 'Video' },
  { name: 'Pika 2.0', icon: '🎥', category: 'Video' },
  { name: 'WanX 2.1', icon: '⚡', category: 'Video' },
  { name: 'Hunyuan Video', icon: '🏮', category: 'Video' },
  { name: 'Google Veo 3.1', icon: '🌟', category: 'Video' },
  { name: 'PixVerse v3', icon: '🎞️', category: 'Video' },
  { name: 'Vidu AI', icon: '🎭', category: 'Video' },
  { name: 'Hailuo MiniMax', icon: '🐚', category: 'Video' },
];

const RIGHT_PROVIDERS = [
  { name: 'Flux Schnell', icon: '⚡', category: 'Image' },
  { name: 'Nano Banana Pro', icon: '🍌', category: 'Image' },
  { name: 'Seedance 2.5', icon: '🌱', category: 'Video' },
  { name: 'MiniMax Hailuo', icon: '🦁', category: 'Audio' },
  { name: 'HiDream-i1', icon: '🎨', category: 'Image' },
  { name: 'Ideogram v4', icon: '📐', category: 'Image' },
  { name: 'Google Imagen 3', icon: '🖼️', category: 'Image' },
  { name: 'GPT Image 1', icon: '👁️', category: 'Vision' },
  { name: 'Qwen Image Edit', icon: '🪄', category: 'Image' },
  { name: 'Wan 2.2 Speech', icon: '🎙️', category: 'Audio' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--tc-bg-page)] text-[var(--tc-text-primary)] flex flex-col font-sans">
      {/* Top Discount Notification Strip */}
      <div className="bg-blue-600 text-white text-xs font-semibold py-2 px-4 text-center flex items-center justify-center gap-4 flex-wrap">
        <span>• 20% discount on Seedance 2</span>
        <Link href="/explore" className="underline hover:text-blue-100">
          Try now
        </Link>
        <span className="opacity-60">|</span>
        <span>• 28% discount on Seedance 2.5</span>
        <Link href="/explore" className="underline hover:text-blue-100">
          Explore API →
        </Link>
        <span className="opacity-60">|</span>
        <span>• Google Veo 3.1 Cinema is live</span>
        <Link href="/veo-3.1" className="underline hover:text-blue-100">
          Open Playground →
        </Link>
      </div>

      <PlatformNav activeModule="home" />

      <main className="flex-1 flex flex-col">
        {/* Hero Circuit Section */}
        <section className="relative overflow-hidden py-16 lg:py-24 border-b border-slate-200/80 bg-gradient-to-b from-slate-50 via-white to-slate-50">
          <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Model Circuit Column */}
              <div className="max-lg:hidden lg:col-span-3 flex flex-col gap-2.5">
                {LEFT_PROVIDERS.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center gap-3 p-2 rounded-lg bg-white border border-slate-200/90 shadow-2xs hover:border-blue-500/60 hover:shadow-xs transition-all"
                  >
                    <span className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center text-sm">
                      {item.icon}
                    </span>
                    <span className="text-xs font-bold text-slate-800 truncate">{item.name}</span>
                    <span className="ml-auto text-[10px] text-slate-400 font-medium">{item.category}</span>
                  </div>
                ))}
              </div>

              {/* Center Hero Card & Call to Action */}
              <div className="lg:col-span-6 text-center px-4">
                <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider mb-6">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                  Unified Generative Compute Gateway
                </span>

                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-tight mb-6">
                  One Unified Gateway for <span className="text-blue-600">Every Multimodal AI Model</span>
                </h1>

                <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed mb-8">
                  The lowest cost, high-throughput unified endpoint for cinema, video, image, and voice generation. Zero subscription lock-in.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-10">
                  <Link
                    href="/explore"
                    className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
                  >
                    Start Building
                  </Link>
                  <Link
                    href="/docs"
                    className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-md text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs"
                  >
                    Read Documentation
                  </Link>
                </div>

                <div className="inline-flex items-center gap-4 text-xs font-medium text-slate-500 flex-wrap justify-center">
                  <span>⚡ Sub-second dispatch</span>
                  <span>·</span>
                  <span>🔒 Durable PostgreSQL queue</span>
                  <span>·</span>
                  <span>🛠️ Local MCP & CLI daemon</span>
                </div>
              </div>

              {/* Right Model Circuit Column */}
              <div className="max-lg:hidden lg:col-span-3 flex flex-col gap-2.5">
                {RIGHT_PROVIDERS.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center gap-3 p-2 rounded-lg bg-white border border-slate-200/90 shadow-2xs hover:border-blue-500/60 hover:shadow-xs transition-all"
                  >
                    <span className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center text-sm">
                      {item.icon}
                    </span>
                    <span className="text-xs font-bold text-slate-800 truncate">{item.name}</span>
                    <span className="ml-auto text-[10px] text-slate-400 font-medium">{item.category}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Feature Stat Strip */}
        <section className="bg-white border-b border-slate-200 py-4 px-4">
          <div className="max-w-[1400px] w-full mx-auto flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-xs font-semibold text-slate-700">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              500+ AI models in one API
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Zero monthly subscription
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Automatic refund on failed tasks
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
              30-60% lower cost vs direct vendor APIs
            </span>
          </div>
        </section>

        {/* Production Model Providers Section */}
        <section className="py-16 bg-[var(--tc-bg-page)]">
          <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                Top Model Ecosystems, One API
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2 mb-3">
                Production Model Providers on Timecapsule
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                The fastest way to experiment, build, and deploy generative AI apps. Access 250+ optimized models with a single unified API key.
              </p>
            </div>

            {/* Ecosystem Chips */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 mb-10">
              {['OpenAI', 'Google DeepMind', 'Kling AI', 'ByteDance', 'Black Forest Labs', 'MiniMax', 'Qwen Image', 'Stability AI'].map((p) => (
                <span
                  key={p}
                  className="px-4 py-2 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-800 shadow-2xs"
                >
                  {p}
                </span>
              ))}
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center justify-center gap-4">
              <Link
                href="/explore"
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
              >
                Browse Full Catalog
              </Link>
              <Link
                href="/pricing"
                className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded text-xs font-bold uppercase tracking-wider transition-colors shadow-2xs"
              >
                Compare Provider Rates
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PlatformFooter />
    </div>
  );
}
