'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import BrandIcon from '@/components/BrandIcon';

const PROVIDERS = [
  {
    id: 'black-forest-labs',
    name: 'Black Forest Labs',
    family: 'flux',
    modelsCount: 12,
    modalities: ['IMAGE', 'VISION'],
    description: 'Pioneers in rectified flow transformers, creators of FLUX.1 Schnell, Dev, and Pro models.',
    verified: true,
    highlight: 'FLUX.1 Schnell · FLUX.1 Dev · FLUX.1 Pro',
  },
  {
    id: 'google-deepmind',
    name: 'Google DeepMind',
    family: 'veo',
    modelsCount: 8,
    modalities: ['VIDEO', 'IMAGE', 'AUDIO'],
    description: 'Creators of Veo 3.1 cinema video generation, Imagen 3, and Lyria music models.',
    verified: true,
    highlight: 'Veo 3.1 T2V · Veo 3.1 I2V · Imagen 3',
  },
  {
    id: 'bytedance',
    name: 'ByteDance',
    family: 'seedance',
    modelsCount: 9,
    modalities: ['VIDEO', 'IMAGE'],
    description: 'High-motion dynamics and multi-angle cinematic cameras with Seedance 2.5 and Seedream.',
    verified: true,
    highlight: 'Seedance 2.5 Pro · Seedream v4.5',
  },
  {
    id: 'kuaishou',
    name: 'Kuaishou Kling',
    family: 'kling',
    modelsCount: 6,
    modalities: ['VIDEO'],
    description: 'Complex physical world simulation, accurate temporal fluid dynamics, and 1080p video generation.',
    verified: true,
    highlight: 'Kling 1.5 Pro · Kling V3.0',
  },
  {
    id: 'alibaba-wanx',
    name: 'Alibaba WanX',
    family: 'wan',
    modelsCount: 8,
    modalities: ['VIDEO', 'LIPSYNC'],
    description: 'High-fidelity video synthesis and facial lip synchronization with Wan 2.1 & Wan 2.2 architectures.',
    verified: true,
    highlight: 'Wan 2.1 T2V · Wan 2.1 I2V',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    family: 'openai',
    modelsCount: 7,
    modalities: ['IMAGE', 'TEXT', 'AUDIO'],
    description: 'DALL-E 3, GPT-4o multimodal vision, and high-fidelity text-to-speech voice generation.',
    verified: true,
    highlight: 'DALL-E 3 · GPT-4o Vision',
  },
  {
    id: 'minimax',
    name: 'MiniMax Hailuo',
    family: 'minimax',
    modelsCount: 5,
    modalities: ['VIDEO', 'AUDIO'],
    description: 'Hailuo AI cinema-grade cinematic video generator with natural camera motion.',
    verified: true,
    highlight: 'Hailuo Video-01 · T2V Director',
  },
  {
    id: 'luma-ai',
    name: 'Luma AI',
    family: 'luma',
    modelsCount: 4,
    modalities: ['VIDEO', '3D'],
    description: 'Dream Machine video generation and neural radiance field 3D Gaussian splatting.',
    verified: true,
    highlight: 'Dream Machine 1.5 · Ray-2',
  },
  {
    id: 'runway',
    name: 'Runway ML',
    family: 'runway',
    modelsCount: 5,
    modalities: ['VIDEO'],
    description: 'Gen-2 and Gen-3 Alpha foundational video world models with fine-grained motion control.',
    verified: true,
    highlight: 'Gen-3 Alpha Turbo',
  },
  {
    id: 'midjourney',
    name: 'Midjourney',
    family: 'midjourney',
    modelsCount: 6,
    modalities: ['IMAGE'],
    description: 'World-renowned artistic composition, lighting realism, and stylistic versatility.',
    verified: true,
    highlight: 'Midjourney v6.1 · Niji 6',
  },
  {
    id: 'ideogram',
    name: 'Ideogram',
    family: 'ideogram',
    modelsCount: 6,
    modalities: ['IMAGE'],
    description: 'Best-in-class graphic design composition, typography rendering, and logo creation.',
    verified: true,
    highlight: 'Ideogram v2.0 · Turbo',
  },
  {
    id: 'suno',
    name: 'Suno AI',
    family: 'audio',
    modelsCount: 4,
    modalities: ['AUDIO'],
    description: 'Full song generation with vocals, instruments, lyrics, and studio mixing in any genre.',
    verified: true,
    highlight: 'Suno v3.5 · Instrumentals',
  },
  {
    id: 'pika-labs',
    name: 'Pika Labs',
    family: 'pika',
    modelsCount: 4,
    modalities: ['VIDEO'],
    description: 'Cinematic visual effects, Pikaffects (inflate, melt, crush), and sound synchronization.',
    verified: true,
    highlight: 'Pika 2.0 · Pikaffects',
  },
  {
    id: 'vidu',
    name: 'ShengShu Vidu',
    family: 'vidu',
    modelsCount: 3,
    modalities: ['VIDEO'],
    description: 'Universal Vision Transformer model rendering high-frame-rate 1080p clips.',
    verified: true,
    highlight: 'Vidu 1.5 Pro',
  },
  {
    id: 'hunyuan',
    name: 'Tencent Hunyuan',
    family: 'hunyuan',
    modelsCount: 4,
    modalities: ['VIDEO', '3D'],
    description: 'Open-weights HunyuanVideo and 3D mesh reconstruction pipeline with multi-lingual support.',
    verified: true,
    highlight: 'HunyuanVideo 1.2',
  },
  {
    id: 'google-banana',
    name: 'Google Nano Banana',
    family: 'banana',
    modelsCount: 4,
    modalities: ['IMAGE'],
    description: 'Ultra-fast low-latency diffusion architecture for high-resolution 1K and 2K stills.',
    verified: true,
    highlight: 'Nano Banana Pro · Edit',
  },
  {
    id: 'stability-ai',
    name: 'Stability AI',
    family: 'flux',
    modelsCount: 7,
    modalities: ['IMAGE', 'VIDEO', 'AUDIO'],
    description: 'Stable Diffusion 3.5, Stable Audio, and open-weights foundation models.',
    verified: true,
    highlight: 'SD 3.5 Large · Stable Audio 2',
  },
  {
    id: 'qwen',
    name: 'Alibaba Qwen',
    family: 'qwen',
    modelsCount: 6,
    modalities: ['VISION', 'TEXT'],
    description: 'Qwen 2.5 multimodal vision-language models with high-precision OCR and document analysis.',
    verified: true,
    highlight: 'Qwen-VL-Max · Qwen 2.5 72B',
  },
  {
    id: 'recraft',
    name: 'Recraft AI',
    family: 'ideogram',
    modelsCount: 3,
    modalities: ['IMAGE'],
    description: 'Vector graphics, brand icon systems, and infinite-canvas generative design.',
    verified: true,
    highlight: 'Recraft 20B · Vector Engine',
  },
  {
    id: 'tripo-3d',
    name: 'Tripo 3D',
    family: 'luma',
    modelsCount: 3,
    modalities: ['3D'],
    description: 'Instant 3D mesh and texture generation from single image prompts in under 10 seconds.',
    verified: true,
    highlight: 'Tripo v2.5 Mesh Engine',
  },
  {
    id: 'fish-audio',
    name: 'Fish Audio',
    family: 'audio',
    modelsCount: 3,
    modalities: ['AUDIO'],
    description: 'Few-shot voice cloning, zero-shot TTS, and multilingual voice acting models.',
    verified: true,
    highlight: 'Fish Speech 1.4',
  },
  {
    id: 'hidream',
    name: 'HiDream AI',
    family: 'hidream',
    modelsCount: 3,
    modalities: ['IMAGE', 'VIDEO'],
    description: 'Diffusion transformer pipeline specialized in photoreal commercial product photography.',
    verified: true,
    highlight: 'HiDream I1 Fast',
  },
  {
    id: 'lumina',
    name: 'Lumina Next',
    family: 'flux',
    modelsCount: 2,
    modalities: ['IMAGE'],
    description: 'Next-generation open multimodal transformer generating images at arbitrary resolutions.',
    verified: true,
    highlight: 'Lumina-Next-T2I',
  },
  {
    id: 'morph-studio',
    name: 'Morph Studio',
    family: 'vidu',
    modelsCount: 2,
    modalities: ['VIDEO'],
    description: 'Text-to-storyboard and cinematic camera sequence chaining pipelines.',
    verified: true,
    highlight: 'Morph Video Director',
  },
  {
    id: 'timecapsule-gpu',
    name: 'Timecapsule Self-Hosted GPU',
    family: 'studio',
    modelsCount: 2,
    modalities: ['IMAGE', 'VIDEO'],
    description: 'Dedicated private GPU clusters with zero external API dependencies and hardware isolation.',
    verified: true,
    highlight: 'Private TensorRT Worker',
  },
];

export default function ProvidersPage() {
  const [search, setSearch] = useState('');
  const [selectedModality, setSelectedModality] = useState('ALL');

  const filteredProviders = useMemo(() => {
    return PROVIDERS.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase()) ||
        p.highlight.toLowerCase().includes(search.toLowerCase());

      const matchesModality =
        selectedModality === 'ALL' || p.modalities.includes(selectedModality);

      return matchesSearch && matchesModality;
    });
  }, [search, selectedModality]);

  return (
    <div className="min-h-screen bg-[var(--tc-bg-page,#09090b)] text-[var(--tc-text-primary,#f5f7fa)] flex flex-col font-sans transition-colors">
      <PlatformNav activeModule="providers" />

      <main className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 xl:px-0 py-10 flex-1 flex flex-col">
        {/* Hero Section */}
        <div className="mb-10 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-black uppercase tracking-widest mb-4">
            <span>⚡</span>
            <span>Multi-Provider Unified Gateway</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-[#f5f7fa] tracking-tight mb-4">
            AI Model Providers & Compute Networks
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
            Unified access to 25 foundational research labs, commercial GPU clusters, and open-weights models through a single deterministic API with PostgreSQL row-level tenant security.
          </p>

          {/* Stats Metric Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/10">
            <div className="p-3 bg-[#121217] border border-white/10 rounded-lg">
              <div className="text-2xl font-black text-blue-400 font-mono">25</div>
              <div className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
                Provider Networks
              </div>
            </div>
            <div className="p-3 bg-[#121217] border border-white/10 rounded-lg">
              <div className="text-2xl font-black text-emerald-400 font-mono">627</div>
              <div className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
                Foundation Models
              </div>
            </div>
            <div className="p-3 bg-[#121217] border border-white/10 rounded-lg">
              <div className="text-2xl font-black text-purple-400 font-mono">4</div>
              <div className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
                Modalities Supported
              </div>
            </div>
            <div className="p-3 bg-[#121217] border border-white/10 rounded-lg">
              <div className="text-2xl font-black text-amber-400 font-mono">100%</div>
              <div className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
                RLS Tenant Fenced
              </div>
            </div>
          </div>
        </div>

        {/* Search & Modality Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 bg-[#121217] p-3 rounded-xl border border-white/10">
          {/* Modality Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {['ALL', 'VIDEO', 'IMAGE', 'AUDIO', '3D'].map((mod) => (
              <button
                key={mod}
                onClick={() => setSelectedModality(mod)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedModality === mod
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {mod === 'ALL' ? 'All Providers' : mod}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search providers or models..."
              className="w-full bg-[#181820] border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <svg
              className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>
        </div>

        {/* 25 Provider Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
          {filteredProviders.map((p) => (
            <div
              key={p.id}
              className="bg-[#121217] border border-white/10 rounded-[12px] p-5 hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.12)] transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Header Row: Provider Icon + Name + Model Count */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#181820] border border-white/10 flex items-center justify-center text-zinc-200 group-hover:border-blue-500/40 transition-colors">
                      <BrandIcon name={p.family} className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-[#f5f7fa] group-hover:text-blue-400 transition-colors">
                        {p.name}
                      </h2>
                      <div className="text-[11px] text-zinc-400 font-mono">
                        {p.modelsCount} models active
                      </div>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-bold uppercase tracking-wider border border-emerald-500/30">
                    Active
                  </span>
                </div>

                {/* Modality Badges */}
                <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                  {p.modalities.map((mod) => (
                    <span
                      key={mod}
                      className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-wider text-zinc-300"
                    >
                      {mod}
                    </span>
                  ))}
                </div>

                {/* Description */}
                <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                  {p.description}
                </p>

                {/* Highlight Models */}
                <div className="p-2.5 rounded bg-[#181820] border border-white/5 text-[11px] font-mono text-zinc-300">
                  <span className="text-zinc-500 text-[10px] uppercase font-bold block mb-0.5">Key Models:</span>
                  <span className="text-blue-300 font-medium">{p.highlight}</span>
                </div>
              </div>

              {/* Action Footer */}
              <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="text-[11px] text-zinc-500 font-mono">Managed Gateway</span>
                <Link
                  href="/explore"
                  className="text-blue-400 group-hover:text-blue-300 font-bold text-xs flex items-center gap-1 transition-colors"
                >
                  <span>Explore Models</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Transparent Multi-Provider Routing Architecture Section */}
        <section className="bg-[#121217] border border-white/10 rounded-2xl p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <h2 className="text-lg sm:text-xl font-bold text-[#f5f7fa] mb-2">
                Transparent Multi-Provider Routing Architecture
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Timecapsule routes to verified provider infrastructure via unified single-tenant execution gateways (including Muapi, Kie, and direct self-hosted TensorRT workers). All API credentials remain isolated server-side, with deterministic integer credit reservations and PostgreSQL Row Level Security protecting your private project data.
              </p>
            </div>
            <Link
              href="/docs"
              className="px-5 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs uppercase tracking-wider transition-all self-start whitespace-nowrap"
            >
              Read Architecture Docs →
            </Link>
          </div>
        </section>
      </main>

      <PlatformFooter />
    </div>
  );
}
