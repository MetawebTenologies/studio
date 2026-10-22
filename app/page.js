'use client';

import Link from 'next/link';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import BrandIcon from '@/components/BrandIcon';

const LEFT_PROVIDERS = [
  { name: 'Kling 2.1 Pro', slug: 'kling', category: 'Video', count: 6 },
  { name: 'Runway Gen-3', slug: 'runway', category: 'Video', count: 4 },
  { name: 'Luma Dream Machine', slug: 'luma', category: 'Video', count: 3 },
  { name: 'Pika 2.0', slug: 'pika', category: 'Video', count: 4 },
  { name: 'WanX 2.1', slug: 'wanx', category: 'Video', count: 8 },
  { name: 'Hunyuan Video', slug: 'hunyuan', category: 'Video', count: 4 },
  { name: 'Google Veo 3.1', slug: 'veo', category: 'Video', count: 4 },
  { name: 'PixVerse v3', slug: 'pixverse', category: 'Video', count: 3 },
  { name: 'Vidu AI', slug: 'vidu', category: 'Video', count: 3 },
  { name: 'Hailuo MiniMax', slug: 'minimax', category: 'Video', count: 5 },
];

const RIGHT_PROVIDERS = [
  { name: 'Flux Schnell', slug: 'flux', category: 'Image', count: 12 },
  { name: 'Nano Banana Pro', slug: 'banana', category: 'Image', count: 4 },
  { name: 'Seedance 2.5', slug: 'seedance', category: 'Video', count: 6 },
  { name: 'MiniMax Hailuo', slug: 'minimax', category: 'Audio', count: 5 },
  { name: 'HiDream-i1', slug: 'hidream', category: 'Image', count: 3 },
  { name: 'Ideogram v4', slug: 'ideogram', category: 'Image', count: 6 },
  { name: 'Google Imagen 3', slug: 'imagen', category: 'Image', count: 4 },
  { name: 'GPT Image 1', slug: 'gpt', category: 'Vision', count: 4 },
  { name: 'Qwen Image Edit', slug: 'qwen', category: 'Image', count: 6 },
  { name: 'Wan 2.2 Speech', slug: 'wanx', category: 'Audio', count: 4 },
];

const HERO_LQIP = 'data:image/webp;base64,UklGRvoAAABXRUJQVlA4WAoAAAAQAAAAFwAABwAAQUxQSJUAAAANuS5E9D80kBvJVu3ofzMzhuD8U7EcAjMz3ST6yevRedt3NDtjAJ+WERMwAUtvvXrSMcCYRcvGXdqxbd+ENZsGMOfQC14BtNy49+QRX1tGyR2gbkOUJsNyPBtmgK9OhFXowYgY0lU4izNNhABETUcQkoFdk2iTU9imduVUAtzq1AhlRgfc/P5nXRWNqs9Id43AmRBRAABWUDggPgAAAHADAJ0BKhgACAA/EXCwUCwmJKKwCAGAIglnAMM0GB6YR/lZAAD9hBAczN3UkqEtDLkN21BXk4aQtlBi5boA';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--tc-bg-page)] text-[var(--tc-text-primary)] flex flex-col font-sans">
      {/* Top Studio Notification Strip */}
      <div className="bg-[#0c0c10] border-b border-white/10 text-[#f5f7fa] text-xs font-medium py-2 px-4 text-center flex items-center justify-center gap-4 flex-wrap">
        <span>• Seedance 2.5 4K Cinema is live</span>
        <Link href="/explore" className="text-[#00e5ff] underline hover:text-[#38bdf8]">
          Explore Studio →
        </Link>
        <span className="opacity-40">|</span>
        <span>• Google Veo 3.1 Director Mode</span>
        <Link href="/explore" className="text-[#00e5ff] underline hover:text-[#38bdf8]">
          Try now
        </Link>
        <span className="opacity-40">|</span>
        <span>• FLUX 3 Klein Inpainting</span>
        <Link href="/explore" className="text-[#00e5ff] underline hover:text-[#38bdf8]">
          Open Studio →
        </Link>
      </div>

      <PlatformNav activeModule="home" />

      <main className="flex-1 flex flex-col">
        {/* Hero Circuit Section with Full-Bleed Cinematic Backdrop (F1) */}
        <section className="relative overflow-hidden py-16 lg:py-24 border-b border-white/10 bg-[#09090b]">
          {/* Full-bleed cinematic artwork backdrop with LQIP and responsive crops */}
          <div
            className="absolute inset-0 pointer-events-none select-none overflow-hidden"
            style={{
              backgroundImage: `url(${HERO_LQIP})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <picture>
              <source media="(max-width: 640px)" srcSet="/assets/hero/hero_banner_grand_cinema_mobile.webp" />
              <img
                src="/assets/hero/hero_banner_grand_cinema.webp"
                alt="Timecapsule Studio Cinematic AI Workspace"
                className="w-full h-full object-cover object-center opacity-30 mix-blend-luminosity filter contrast-125"
                loading="eager"
              />
            </picture>
            {/* Multi-layer gradient overlays ensuring WCAG AA contrast ratio (>7:1) */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#09090b]/90 via-[#09090b]/75 to-[#09090b]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#00e5ff]/5 via-transparent to-transparent" />
          </div>

          <div className="relative z-10 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Model Circuit Column */}
              <div className="max-lg:hidden lg:col-span-3 flex flex-col gap-2.5">
                {LEFT_PROVIDERS.map((item) => (
                  <div
                    key={item.name}
                    className="group flex items-center gap-3 p-2 rounded-lg bg-[#121217] border border-white/10 hover:border-[#00e5ff]/50 hover:shadow-[0_0_15px_rgba(0,229,255,0.1)] transition-all"
                  >
                    <span className="w-7 h-7 rounded bg-[#181820] border border-white/5 flex items-center justify-center text-zinc-400 group-hover:text-[#00e5ff] transition-colors">
                      <BrandIcon name={item.slug || item.name} className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-xs font-bold text-[#f5f7fa] truncate">{item.name}</span>
                    <span className="ml-auto flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] text-zinc-500 font-medium">{item.category}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#181820] text-zinc-400 font-mono border border-white/5">
                        {item.count}
                      </span>
                    </span>
                  </div>
                ))}
              </div>

              {/* Center Hero Card & Call to Action */}
              <div className="lg:col-span-6 text-center px-4">
                <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#00e5ff]/10 border border-[#00e5ff]/30 text-[#00e5ff] text-xs font-bold uppercase tracking-wider mb-6">
                  <span className="w-2 h-2 rounded-full bg-[#00e5ff] animate-pulse" />
                  Cinematic AI Workspace
                </span>

                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#f5f7fa] leading-tight mb-6">
                  Direct Multimodal Scenes in <span className="text-[#00e5ff]">Timecapsule Studio</span>
                </h1>

                <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto leading-relaxed mb-8">
                  From imagination to motion. A unified cinematic workspace for turning ideas into generative video, photorealistic scenes, and creative workflows.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-10">
                  <Link
                    href="/explore"
                    className="w-full sm:w-auto px-6 py-3 bg-[#00e5ff] hover:bg-[#38bdf8] text-[#09090b] rounded-md text-xs font-black uppercase tracking-wider transition-colors shadow-sm"
                  >
                    Explore Models
                  </Link>
                  <Link
                    href="/studio"
                    className="w-full sm:w-auto px-6 py-3 bg-[#121217] hover:bg-[#181820] border border-white/10 text-[#f5f7fa] rounded-md text-xs font-bold uppercase tracking-wider transition-colors"
                  >
                    Launch Studio
                  </Link>
                </div>

                <div className="inline-flex items-center gap-4 text-xs font-medium text-zinc-500 flex-wrap justify-center">
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
                    className="group flex items-center gap-3 p-2 rounded-lg bg-[#121217] border border-white/10 hover:border-[#00e5ff]/50 hover:shadow-[0_0_15px_rgba(0,229,255,0.1)] transition-all"
                  >
                    <span className="w-7 h-7 rounded bg-[#181820] border border-white/5 flex items-center justify-center text-zinc-400 group-hover:text-[#00e5ff] transition-colors">
                      <BrandIcon name={item.slug || item.name} className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-xs font-bold text-[#f5f7fa] truncate">{item.name}</span>
                    <span className="ml-auto flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] text-zinc-500 font-medium">{item.category}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#181820] text-zinc-400 font-mono border border-white/5">
                        {item.count}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Feature Stat Strip */}
        <section className="bg-[#0c0c10] border-b border-white/10 py-4 px-4">
          <div className="max-w-[1400px] w-full mx-auto flex flex-wrap items-center justify-center gap-6 sm:gap-12 text-xs font-semibold text-zinc-400">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00e5ff]" />
              500+ Curated AI models
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Pay-per-second precision
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Automatic refund on failed tasks
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#9b8cff]" />
              Direct studio orchestration
            </span>
          </div>
        </section>

        {/* Production Model Providers Section (F4: Monochrome Logos & Routing Disclosure) */}
        <section className="py-16 bg-[#09090b] border-t border-white/5">
          <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#00e5ff]">
                Model Gateway Ecosystem
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#f5f7fa] tracking-tight mt-2 mb-3">
                Foundation Model Providers
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Models available on Timecapsule · multi-provider routing via integrated provider gateways
              </p>
            </div>

            {/* Ecosystem Logo Marks (Open-licensed monochrome marks + wordmarks) */}
            <div className="flex flex-wrap items-center justify-center gap-3 max-w-4xl mx-auto mb-10">
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
                  className="group flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-[#121217] border border-white/10 hover:border-[#00e5ff]/50 hover:bg-[#181820] hover:shadow-[0_0_15px_rgba(0,229,255,0.08)] transition-all cursor-default select-none"
                >
                  <span className="w-5 h-5 flex items-center justify-center text-zinc-400 group-hover:text-[#00e5ff] transition-colors">
                    <BrandIcon name={p.slug} className="w-4 h-4" />
                  </span>
                  <span className="text-xs font-bold text-zinc-300 group-hover:text-white transition-colors">
                    {p.name}
                  </span>
                </div>
              ))}
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center justify-center gap-4">
              <Link
                href="/explore"
                className="px-5 py-2.5 bg-[#00e5ff] hover:bg-[#38bdf8] text-[#09090b] rounded text-xs font-black uppercase tracking-wider transition-colors shadow-xs"
              >
                Browse Full Catalog
              </Link>
              <Link
                href="/pricing"
                className="px-5 py-2.5 bg-[#121217] border border-white/10 hover:bg-[#181820] text-zinc-300 hover:text-[#f5f7fa] rounded text-xs font-bold uppercase tracking-wider transition-colors"
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
