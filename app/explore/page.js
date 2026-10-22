'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import ModuleStatusBadge from '@/components/ModuleStatusBadge';

const CINEMA_THUMBNAILS = [
  '/assets/cinema/classic_anamorphic.webp',
  '/assets/cinema/70s_cinema_prime.webp',
  '/assets/cinema/full_frame_cine_digital.webp',
  '/assets/cinema/modular_8k_digital.webp',
  '/assets/cinema/vintage_prime.webp',
  '/assets/cinema/swirl_bokeh_portrait.webp',
  '/assets/cinema/warm_cinema_prime.webp',
  '/assets/cinema/premium_modern_prime.webp',
  '/assets/cinema/grand_format_70mm_film.webp',
  '/assets/cinema/classic_16mm_film.webp',
  '/assets/cinema/clinical_sharp_prime.webp',
  '/assets/cinema/compact_anamorphic.webp',
  '/assets/cinema/creative_tilt_lens.webp',
  '/assets/cinema/f_1_4.webp',
  '/assets/cinema/f_4.webp',
  '/assets/cinema/f_11.webp',
  '/assets/cinema/halation_diffusion.webp',
  '/assets/cinema/studio_digital_s35.webp',
];

const PROVIDER_TAGS = [
  { name: 'LLM Models', icon: '💬' },
  { name: 'Gemini Omni Models', icon: '✨' },
  { name: 'HappyHorse Models', icon: '🐎' },
  { name: 'Seedance 2 Models', icon: '📊' },
  { name: 'GPT Image Models', icon: '🖼️' },
  { name: 'Veo 3.1 Models', icon: '✨' },
  { name: 'Nano Banana Models', icon: '🍌' },
  { name: 'Midjourney Models', icon: '🎨' },
  { name: 'Suno Models', icon: '🎵' },
  { name: 'Wan 2.7 Models', icon: '⚡' },
  { name: 'Qwen Image Models', icon: '👁️' },
  { name: 'Grok Models', icon: '⚡' },
  { name: 'Vidu Models', icon: '📹' },
  { name: 'Seedance 1.5 Models', icon: '📊' },
];

const TASK_TAGS = [
  { name: 'Upscale Image', icon: '🔍' },
  { name: 'Upscale Video', icon: '🎬' },
  { name: 'Faceswap', icon: '🔄' },
  { name: 'Background Remover', icon: '✂️' },
  { name: 'Product', icon: '📦' },
  { name: 'Image Extension', icon: '📐' },
  { name: 'Skin Enhancer', icon: '👤' },
  { name: 'Color Photo', icon: '🎨' },
  { name: 'LoRA', icon: '🧩' },
  { name: 'Ghibli Style', icon: '🎨' },
  { name: 'Object Eraser', icon: '🧹' },
  { name: 'Lipsync', icon: '👄' },
  { name: 'Watermark', icon: '💧' },
];

const CATEGORIES_FACET = [
  { id: 'all', label: 'All Categories', count: 622 },
  { id: 'i2v', label: 'Image to Video', count: 137 },
  { id: 'llm', label: 'Text Generation', count: 92 },
  { id: 't2v', label: 'Text to Video', count: 91 },
  { id: 'i2i', label: 'Image Editing', count: 81 },
  { id: 't2i', label: 'Text to Image', count: 76 },
  { id: 'v2v', label: 'Video Editing', count: 61 },
  { id: 'llm_core', label: 'LLM', count: 51 },
  { id: 'audio', label: 'AI Audio', count: 25 },
  { id: 'lora', label: 'LoRA Support', count: 17 },
  { id: 'training', label: 'Training', count: 13 },
  { id: 'lipsync', label: 'Lipsync', count: 13 },
  { id: '3d', label: 'Image to 3D', count: 7 },
  { id: 'other', label: 'other', count: 6 },
  { id: 't3d', label: 'Text to 3D', count: 3 },
];

export default function ExplorePage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [activeMainTab, setActiveMainTab] = useState('models');

  // Authoritative catalog models with editorial metadata
  const allModels = useMemo(() => [
    {
      id: 'flux-3-klein-edit-image',
      name: 'flux-3-klein-edit-image',
      category: 'IMAGE EDITING',
      catId: 'i2i',
      price: '$0.009',
      originalPrice: '$0.0108',
      discount: '11%',
      provider: 'timecapsule',
      description: 'Edit reference images with Black Forest Labs FLUX 3 Klein using precise prompt instructions.',
      thumb: CINEMA_THUMBNAILS[0],
    },
    {
      id: 'flux-3-klein-text-to-image',
      name: 'flux-3-klein-text-to-image',
      category: 'TEXT TO IMAGE',
      catId: 't2i',
      price: '$0.009',
      originalPrice: '$0.0108',
      discount: '11%',
      provider: 'timecapsule',
      description: 'Generate photorealistic images with Black Forest Labs FLUX 3 Klein via asynchronous API. Choose 1K, 2K, or 4K.',
      thumb: CINEMA_THUMBNAILS[1],
    },
    {
      id: 'lyria-2',
      name: 'lyria-2',
      category: 'AI AUDIO',
      catId: 'audio',
      price: '$0.060',
      originalPrice: '$0.0687',
      discount: '11%',
      provider: 'google',
      description: 'Google Instrumental music generation model. Describe the style and mood in a prompt and get studio-grade audio.',
      thumb: CINEMA_THUMBNAILS[2],
    },
    {
      id: 'lyria-3',
      name: 'lyria-3',
      category: 'AI AUDIO',
      catId: 'audio',
      price: '$0.040',
      originalPrice: '$0.0444',
      discount: '10%',
      provider: 'google',
      description: 'High-fidelity short music clips of up to 30 seconds for creative transitions, themes, and intros.',
      thumb: CINEMA_THUMBNAILS[3],
    },
    {
      id: 'lyria-3-pro',
      name: 'lyria-3-pro',
      category: 'AI AUDIO',
      catId: 'audio',
      price: '$0.080',
      originalPrice: '$0.0888',
      discount: '11%',
      provider: 'google',
      description: 'Google flagship music model: describe genre, mood, instruments, and arrangement structure for full compositions.',
      thumb: CINEMA_THUMBNAILS[4],
    },
    {
      id: 'fish-s2-1-pro',
      name: 'fish-s2-1-pro',
      category: 'AI AUDIO',
      catId: 'audio',
      price: '$0.015',
      originalPrice: '$0.0167',
      discount: '11%',
      provider: 'fishaudio',
      description: 'Fish Audio S2.1 Pro is a high-fidelity text-to-speech model built for long-form narration. Up to 10,000 characters.',
      thumb: CINEMA_THUMBNAILS[5],
    },
    {
      id: 'elevenlabs-v4',
      name: 'elevenlabs-v4',
      category: 'AI AUDIO',
      catId: 'audio',
      price: '$0.080',
      originalPrice: '$0.0888',
      discount: '11%',
      provider: 'elevenlabs',
      description: 'Eleven v4 text-to-speech engine delivering nuanced expressive narration with multi-lingual voice cloning.',
      thumb: CINEMA_THUMBNAILS[6],
    },
    {
      id: 'ideogram-v4',
      name: 'ideogram-v4',
      category: 'TEXT TO IMAGE',
      catId: 't2i',
      price: '$0.060',
      originalPrice: '$0.0667',
      discount: '11%',
      provider: 'ideogram',
      description: 'Ideogram 4.0 generation engine, optimized for clean typographic rendering, logos, and graphic layouts.',
      thumb: CINEMA_THUMBNAILS[7],
    },
    {
      id: 'seedance-2-5-pro-t2v',
      name: 'seedance-2-5-pro-t2v',
      category: 'TEXT TO VIDEO',
      catId: 't2v',
      price: '$0.170',
      originalPrice: '$0.2400',
      discount: '28%',
      provider: 'bytedance',
      description: 'ByteDance next-gen Seedance 2.5 with cinematic multi-camera motion consistency and 720p output.',
      thumb: CINEMA_THUMBNAILS[8],
    },
    {
      id: 'veo-3-1-fast-text-to-video',
      name: 'veo-3-1-fast-text-to-video',
      category: 'TEXT TO VIDEO',
      catId: 't2v',
      price: '$0.150',
      originalPrice: '$0.1800',
      discount: '17%',
      provider: 'kie',
      description: 'Google Veo 3.1 cinematic text-to-video with photorealistic lighting and director-level camera controls.',
      thumb: CINEMA_THUMBNAILS[9],
    },
    {
      id: 'nano-banana-pro',
      name: 'nano-banana-pro',
      category: 'TEXT TO IMAGE',
      catId: 't2i',
      price: '$0.015',
      originalPrice: '$0.0200',
      discount: '25%',
      provider: 'muapi',
      description: 'Ultra-fast high-detail portrait and cinematic character engine with verified idempotency ledger.',
      thumb: CINEMA_THUMBNAILS[10],
    },
    {
      id: 'wan-2-2-speech-to-video',
      name: 'wan-2-2-speech-to-video',
      category: 'LIP SYNC',
      catId: 'lipsync',
      price: '$0.120',
      originalPrice: '$0.1500',
      discount: '20%',
      provider: 'muapi',
      description: 'Precise phoneme-to-viseme lip synchronization supporting multi-lingual vocal tracks and realistic head motion.',
      thumb: CINEMA_THUMBNAILS[11],
    },
    {
      id: 'seedance-pro-t2v',
      name: 'seedance-pro-t2v',
      category: 'TEXT TO VIDEO',
      catId: 't2v',
      price: '$0.015',
      originalPrice: '$0.018',
      discount: '11%',
      provider: 'muapi',
      description: 'High-fidelity video generative pipeline powered by Muapi. Supports full batch automation.',
      thumb: CINEMA_THUMBNAILS[12],
    },
    {
      id: 'veo3.1-fast-text-to-video',
      name: 'veo3.1-fast-text-to-video',
      category: 'TEXT TO VIDEO',
      catId: 't2v',
      price: '$0.015',
      originalPrice: '$0.018',
      discount: '11%',
      provider: 'kie',
      description: 'High-fidelity video generative pipeline powered by Kie. Supports full batch automation.',
      thumb: CINEMA_THUMBNAILS[13],
    },
    {
      id: 'nano-banana-pro-edit',
      name: 'nano-banana-pro-edit',
      category: 'IMAGE EDITING',
      catId: 'i2i',
      price: '$0.015',
      originalPrice: '$0.018',
      discount: '11%',
      provider: 'muapi',
      description: 'High-fidelity i2i generative pipeline powered by Muapi. Supports full batch automation.',
      thumb: CINEMA_THUMBNAILS[14],
    },
    {
      id: 'seedance-pro-i2v',
      name: 'seedance-pro-i2v',
      category: 'IMAGE TO VIDEO',
      catId: 'i2v',
      price: '$0.015',
      originalPrice: '$0.018',
      discount: '11%',
      provider: 'muapi',
      description: 'High-fidelity i2v generative pipeline powered by Muapi. Supports full batch automation.',
      thumb: CINEMA_THUMBNAILS[15],
    },
    {
      id: 'veo3.1-fast-image-to-video',
      name: 'veo3.1-fast-image-to-video',
      category: 'IMAGE TO VIDEO',
      catId: 'i2v',
      price: '$0.015',
      originalPrice: '$0.018',
      discount: '11%',
      provider: 'kie',
      description: 'High-fidelity i2v generative pipeline powered by Kie. Supports full batch automation.',
      thumb: CINEMA_THUMBNAILS[16],
    },
    {
      id: 'infinitetalk-image-to-video',
      name: 'infinitetalk-image-to-video',
      category: 'LIPSYNC',
      catId: 'lipsync',
      price: '$0.015',
      originalPrice: '$0.018',
      discount: '11%',
      provider: 'muapi',
      description: 'High-fidelity lipsync generative pipeline powered by Muapi. Supports full batch automation.',
      thumb: CINEMA_THUMBNAILS[17],
    },
  ], []);

  const filteredModels = useMemo(() => {
    return allModels.filter((m) => {
      const matchesCat =
        selectedCategory === 'all' ||
        m.catId === selectedCategory ||
        (selectedCategory === 'i2v' && m.catId === 'i2v') ||
        (selectedCategory === 't2v' && m.catId === 't2v');

      const matchesSearch =
        !search ||
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.description.toLowerCase().includes(search.toLowerCase()) ||
        m.provider.toLowerCase().includes(search.toLowerCase()) ||
        m.category.toLowerCase().includes(search.toLowerCase());

      return matchesCat && matchesSearch;
    });
  }, [allModels, selectedCategory, search]);

  return (
    <div className="min-h-screen bg-[var(--tc-bg-page,#f8fafc)] text-[var(--tc-text-primary,#0f172a)] flex flex-col font-sans transition-colors">
      <PlatformNav activeModule="explore" />

      <main className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 xl:px-0 py-6 flex-1 flex flex-col">
        {/* Billboard Announcement Banner — Faithful Muapi Placement */}
        <div className="w-full relative overflow-hidden rounded-md border border-slate-800 bg-[#070709] text-white p-6 sm:p-8 lg:p-10 mb-6 shadow-md">
          {/* Subtle accent glow */}
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-blue-600/20 via-indigo-600/10 to-transparent pointer-events-none" />

          <div className="relative z-10 flex flex-col justify-between min-h-[160px]">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest border border-blue-500/40">
                  New Release v12
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/40">
                  Working
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black uppercase tracking-tight text-white max-w-3xl leading-snug">
                🎬 Seedance 2.5 at a 28% Discount — Now Live on Timecapsule!
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed mt-2.5">
                ByteDance&apos;s next-gen Seedance 2.5 is available on Timecapsule, with text-to-video, image-to-video, first/last-frame, and multi-reference endpoints. Generate up to 30-second clips at 480p/720p, starting from $0.17/sec — up to 28% cheaper than other providers.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-6">
              <Link
                href="/explore"
                className="px-4 py-2.5 bg-white text-black font-black text-[11px] uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all duration-200 rounded-sm shadow-xs"
              >
                Explore Collection
              </Link>
              <Link
                href="/studio?preview=1"
                className="px-4 py-2.5 bg-white/10 text-white font-bold text-[11px] uppercase tracking-widest hover:bg-white/20 transition-all duration-200 rounded-sm border border-white/20"
              >
                Try in Studio
              </Link>
            </div>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="w-full relative mb-3">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search models..."
            className="w-full h-12 bg-white border border-slate-200/90 rounded-[4px] pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 shadow-xs transition-colors"
          />
        </div>

        {/* Category Tag Cloud Row 1 (Provider/Family) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 text-xs">
          {PROVIDER_TAGS.map((tag) => (
            <button
              key={tag.name}
              onClick={() => setSearch(tag.name.replace(' Models', ''))}
              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all whitespace-nowrap shadow-xs text-[11px] font-semibold"
            >
              <span>{tag.icon}</span>
              <span>{tag.name}</span>
            </button>
          ))}
          <button
            onClick={() => setSearch('')}
            className="text-blue-600 hover:text-blue-700 text-xs font-semibold whitespace-nowrap px-2"
          >
            See all providers →
          </button>
        </div>

        {/* Category Tag Cloud Row 2 (Task/Capability) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-4 text-xs">
          {TASK_TAGS.map((tag) => (
            <button
              key={tag.name}
              onClick={() => setSearch(tag.name)}
              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all whitespace-nowrap shadow-xs text-[11px] font-semibold"
            >
              <span>{tag.icon}</span>
              <span>{tag.name}</span>
            </button>
          ))}
        </div>

        {/* Top Category Filter Tabs */}
        <div className="flex items-center gap-2 my-2 border-b border-slate-200/80 pb-3">
          <button
            onClick={() => setActiveMainTab('models')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeMainTab === 'models'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            AI Models <span className="opacity-80">622</span>
          </button>
          <button
            onClick={() => setActiveMainTab('lead')}
            className="bg-white text-slate-600 hover:text-slate-900 border border-slate-200 px-3.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all"
          >
            Lead Enrichment <span className="text-slate-400">20</span>
          </button>
          <button
            onClick={() => setActiveMainTab('seo')}
            className="bg-white text-slate-600 hover:text-slate-900 border border-slate-200 px-3.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all"
          >
            SEO <span className="text-slate-400">28</span>
          </button>
          <button
            onClick={() => setActiveMainTab('social')}
            className="bg-white text-slate-600 hover:text-slate-900 border border-slate-200 px-3.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all"
          >
            Social <span className="text-slate-400">10</span>
          </button>
          <button
            onClick={() => setActiveMainTab('scraping')}
            className="bg-white text-slate-600 hover:text-slate-900 border border-slate-200 px-3.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all"
          >
            Scraping <span className="text-slate-400">4</span>
          </button>
        </div>

        {/* 2-Column Explorer Section — 240px Facet Sidebar + 1fr Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8 mt-4">
          {/* Left Sidebar: CATEGORY Facet */}
          <aside className="w-full shrink-0">
            <h3 className="text-slate-900 font-bold text-xs uppercase tracking-wider">Category</h3>
            <p className="text-slate-500 text-xs mt-0.5 mb-4">
              Showing {filteredModels.length} of {allModels.length} models
            </p>

            <div className="space-y-1">
              {CATEGORIES_FACET.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full flex items-center justify-between py-1.5 px-2 rounded-md text-left text-xs transition-colors ${
                      isSelected
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-slate-700 hover:bg-slate-100/70 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span
                        className={`w-4 h-4 rounded-[3px] border flex items-center justify-center text-[10px] font-bold ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && '✓'}
                      </span>
                      <span className="truncate">{cat.label}</span>
                    </div>
                    <span className="text-slate-400 text-[11px] font-mono">{cat.count}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Right Main Grid: FEATURED MODELS */}
          <main className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-slate-900 font-bold text-sm uppercase tracking-wider">Featured Models</h2>
              <div className="flex items-center gap-2">
                <span className="bg-white border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-700 flex items-center gap-2 cursor-pointer shadow-xs">
                  <span>Newly Added</span>
                  <span className="text-[10px] text-slate-400">▾</span>
                </span>
              </div>
            </div>

            {/* 2-Column Horizontal Cards Grid — Exact Muapi Card Structure */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {filteredModels.map((m) => (
                <Link
                  key={m.id}
                  href={`/${m.id}`}
                  className="flex bg-white border border-slate-200/90 rounded-[6px] overflow-hidden group hover:border-blue-500/60 hover:shadow-md transition-all duration-300 min-h-[160px]"
                >
                  {/* Left Media Thumbnail with Absolute Discount Badge */}
                  <div className="w-32 aspect-square shrink-0 overflow-hidden relative bg-slate-100 flex items-center justify-center">
                    <img
                      src={m.thumb}
                      alt={m.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {m.discount && (
                      <div className="absolute top-2 left-2 bg-[#D9FF00] text-black text-[10px] font-black px-1.5 py-0.5 rounded-sm shadow-xs">
                        {m.discount}
                      </div>
                    )}
                  </div>

                  {/* Right Details Panel */}
                  <div className="flex-1 p-3.5 sm:p-4 flex flex-col justify-between min-w-0">
                    <div>
                      {/* Top Category & Price Row */}
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[11px] font-bold text-blue-600 uppercase tracking-widest truncate">
                          {m.category}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0 text-xs">
                          {m.originalPrice && (
                            <span className="text-[11px] text-slate-400 line-through opacity-60 font-bold">
                              {m.originalPrice}
                            </span>
                          )}
                          <span className="text-[13px] font-black text-[#22C55E]">
                            {m.price}
                          </span>
                        </div>
                      </div>

                      {/* Model Name Heading */}
                      <h2 className="text-[14px] sm:text-[15px] font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-tight break-words mt-1">
                        {m.name}
                      </h2>

                      {/* Model Description */}
                      <p className="text-[12px] text-slate-600 line-clamp-2 sm:line-clamp-3 leading-relaxed font-medium mt-1">
                        {m.description}
                      </p>
                    </div>

                    {/* Footer Provider & Action */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400 mt-2">
                      <span className="truncate">
                        Provider: <span className="text-slate-700 font-semibold">{m.provider}</span>
                      </span>
                      <span className="text-blue-600 group-hover:text-blue-700 font-bold text-xs flex items-center gap-0.5">
                        Try Model →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </main>
        </div>

        {/* Browse AI Models by Category Section */}
        <section className="mt-16 pt-10 border-t border-slate-200">
          <h2 className="text-slate-900 font-bold text-base mb-6">Browse AI Models by Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-xs">
            {/* Text to image */}
            <div>
              <div className="flex items-center justify-between mb-3 text-slate-800 font-semibold">
                <span>Text to image</span>
                <Link href="/explore" className="text-blue-600 hover:underline text-[11px]">View all →</Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {['Nano Banana', 'Gpt Image 2 Text To Image', 'Flux Schnell', 'Ideogram V3 T2I', 'Nano Banana 2', 'Nano Banana Pro', 'Flux Dev', 'Z Image Turbo', 'Bytedance Seedream 5.0 Pro'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setSearch(t)}
                    className="px-2.5 py-1 rounded bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[11px] transition-colors shadow-xs"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Text to Video */}
            <div>
              <div className="flex items-center justify-between mb-3 text-slate-800 font-semibold">
                <span>Text to Video</span>
                <Link href="/explore" className="text-blue-600 hover:underline text-[11px]">View all →</Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {['Seedance Lite T2v', 'Seedance 2 T2v', 'Seedance 2 Mini Omni Reference', 'Wan3.0 Spicy Text To Video', 'Grok Imagine Text To Video', 'Seedance 2.5 Text To Video', 'Kling V3.0 Standard Text To Video', 'Wan2.2 Text To Video'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setSearch(t)}
                    className="px-2.5 py-1 rounded bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[11px] transition-colors shadow-xs"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Image to Video */}
            <div>
              <div className="flex items-center justify-between mb-3 text-slate-800 font-semibold">
                <span>Image to Video</span>
                <Link href="/explore" className="text-blue-600 hover:underline text-[11px]">View all →</Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {['Grok Imagine Image To Video', 'Seedance 2.5 Omni Reference', 'Seedance 2.5 Spicy Omni Reference', 'Wan3.0 Spicy Reference To Video', 'Wan3.0 Reference To Video', 'Kling V3.0 Pro Image To Video', 'Seedance 2 I2v'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setSearch(t)}
                    className="px-2.5 py-1 rounded bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[11px] transition-colors shadow-xs"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <PlatformFooter />
    </div>
  );
}
