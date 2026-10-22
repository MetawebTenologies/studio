'use client';

import { useState, useEffect, useMemo } from 'react';
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
  { name: 'Social Scrapper', icon: '🕸️' },
  { name: 'Social Media Publish', icon: '📢' },
  { name: 'SEO', icon: '📈' },
];

const CATEGORIES_FACET = [
  { id: 'all', label: 'All Categories', count: 622 },
  { id: 'i2v', label: 'Image to Video', count: 137 },
  { id: 't2t', label: 'Text Generation', count: 92 },
  { id: 't2v', label: 'Text to Video', count: 91 },
  { id: 'i2i', label: 'Image Editing', count: 81 },
  { id: 't2i', label: 'Text to Image', count: 76 },
  { id: 'v2v', label: 'Video Editing', count: 61 },
  { id: 'llm', label: 'LLM', count: 51 },
  { id: 'audio', label: 'AI Audio', count: 25 },
  { id: 'lora', label: 'LoRA Support', count: 17 },
  { id: 'training', label: 'Training', count: 13 },
  { id: 'lipsync', label: 'Lipsync', count: 13 },
  { id: '3d', label: 'Image to 3D', count: 7 },
  { id: 'other', label: 'other', count: 6 },
  { id: 'text3d', label: 'Text to 3D', count: 3 },
];

// Rich model descriptions and discounts matching Muapi layout
const CURATED_MODELS = [
  {
    id: 'flux-3-klein-edit-image',
    name: 'flux-3-klein-edit-image',
    category: 'IMAGE EDITING',
    originalPrice: '$0.0100',
    price: '$0.009',
    discount: '11%',
    description: 'Edit one to ten reference images with Black Forest Labs FLUX 3 Klein using natural-language instruction. Choose 1K, 2K, or 4K output.',
    provider: 'timecapsule',
    thumb: CINEMA_THUMBNAILS[0],
  },
  {
    id: 'flux-3-klein-text-to-image',
    name: 'flux-3-klein-text-to-image',
    category: 'TEXT TO IMAGE',
    originalPrice: '$0.0100',
    price: '$0.009',
    discount: '11%',
    description: 'Generate images with Black Forest Labs FLUX 3 Klein through a single asynchronous API. Choose 1K, 2K, or 4K output, nine aspect ratios, PNG/JPEG/WebP format.',
    provider: 'timecapsule',
    thumb: CINEMA_THUMBNAILS[1],
  },
  {
    id: 'lyria-2',
    name: 'lyria-2',
    category: 'AI AUDIO',
    originalPrice: '$0.0687',
    price: '$0.060',
    discount: '11%',
    description: "Lyria 2 is Google's instrumental music generation model. Describe the style and mood in a text prompt and get a roughly 30-second instrumental track as an MP3.",
    provider: 'google',
    thumb: CINEMA_THUMBNAILS[2],
  },
  {
    id: 'lyria-3',
    name: 'lyria-3',
    category: 'AI AUDIO',
    originalPrice: '$0.0444',
    price: '$0.040',
    discount: '10%',
    description: 'Lyria 3 generates short, high-quality music clips of up to 30 seconds from a text prompt — perfect for jingles, intros, loops and background tracks.',
    provider: 'google',
    thumb: CINEMA_THUMBNAILS[3],
  },
  {
    id: 'lyria-3-pro',
    name: 'lyria-3-pro',
    category: 'AI AUDIO',
    originalPrice: '$0.0880',
    price: '$0.080',
    discount: '11%',
    description: 'Lyria 3 Pro is Google flagship music model: describe a genre, mood, instruments and structure and it composes a full-length song of up to three minutes.',
    provider: 'google',
    thumb: CINEMA_THUMBNAILS[4],
  },
  {
    id: 'fish-s2-1-pro',
    name: 'fish-s2-1-pro',
    category: 'AI AUDIO',
    originalPrice: '$0.0167',
    price: '$0.015',
    discount: '11%',
    description: 'Fish Audio S2.1 Pro is a high-fidelity text-to-speech model built for long-form narration. Send up to 10,000 characters in one request and get back natural audio.',
    provider: 'fish-audio',
    thumb: CINEMA_THUMBNAILS[5],
  },
  {
    id: 'elevenlabs-v4',
    name: 'elevenlabs-v4',
    category: 'AI AUDIO',
    originalPrice: '$0.0880',
    price: '$0.080',
    discount: '11%',
    description: 'Eleven v4 is ElevenLabs latest text-to-speech model, delivering highly expressive, natural single-voice narration. Send up to 2,000 characters and get back ultra-realistic audio.',
    provider: 'elevenlabs',
    thumb: CINEMA_THUMBNAILS[6],
  },
  {
    id: 'ideogram-v4',
    name: 'ideogram-v4',
    category: 'TEXT TO IMAGE',
    originalPrice: '$0.0667',
    price: '$0.060',
    discount: '11%',
    description: "Ideogram 4.0 is Ideogram's latest text-to-image model, built for sharp, legible typography, clean graphic design and photorealistic scenes.",
    provider: 'ideogram',
    thumb: CINEMA_THUMBNAILS[7],
  },
  {
    id: 'seedance-2-5-pro',
    name: 'seedance-2-5-pro-t2v',
    category: 'TEXT TO VIDEO',
    originalPrice: '$0.2400',
    price: '$0.170',
    discount: '28%',
    description: "ByteDance's next-gen Seedance 2.5 with text-to-video, multi-camera consistency, and 720p cinematic motion up to 30 seconds.",
    provider: 'bytedance',
    thumb: CINEMA_THUMBNAILS[8],
  },
  {
    id: 'veo-3-1-fast-t2v',
    name: 'veo-3-1-fast-text-to-video',
    category: 'TEXT TO VIDEO',
    originalPrice: '$0.1800',
    price: '$0.150',
    discount: '17%',
    description: "Google's Veo 3.1 cinematic text-to-video engine with 1080p photorealistic lighting and director-level camera controls.",
    provider: 'kie',
    thumb: CINEMA_THUMBNAILS[9],
  },
  {
    id: 'nano-banana-pro',
    name: 'nano-banana-pro',
    category: 'TEXT TO IMAGE',
    originalPrice: '$0.0200',
    price: '$0.015',
    discount: '25%',
    description: 'Ultra-fast high-detail portrait and cinematic character engine with zero-leak credit ledgers.',
    provider: 'muapi',
    thumb: CINEMA_THUMBNAILS[10],
  },
  {
    id: 'wan-2-2-speech-to-video',
    name: 'wan-2-2-speech-to-video',
    category: 'LIP SYNC',
    originalPrice: '$0.1500',
    price: '$0.120',
    discount: '20%',
    description: 'Precise phoneme-to-viseme lip synchronization supporting multi-lingual vocal tracks and realistic head motion.',
    provider: 'muapi',
    thumb: CINEMA_THUMBNAILS[11],
  },
];

export default function ExplorePage() {
  const [catalog, setCatalog] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeMainTab, setActiveMainTab] = useState('models');

  useEffect(() => {
    fetch('/api/v1/models')
      .then((r) => r.json())
      .then((data) => setCatalog(data))
      .catch(() => {});
  }, []);

  // Merge live API catalog models with our rich curated display
  const allModels = useMemo(() => {
    if (!catalog?.catalog) return CURATED_MODELS;

    const apiModels = [
      ...(catalog.catalog.t2i || []),
      ...(catalog.catalog.t2v || []),
      ...(catalog.catalog.i2i || []),
      ...(catalog.catalog.i2v || []),
      ...(catalog.catalog.lipsync || []),
    ];

    const mappedApi = apiModels.map((m, idx) => {
      const existing = CURATED_MODELS.find((c) => c.id === m.id);
      if (existing) return existing;
      const catUpper = (m.modality || 'IMAGE').toUpperCase();
      return {
        id: m.id,
        name: m.id,
        category: catUpper === 'T2V' ? 'TEXT TO VIDEO' : catUpper === 'I2V' ? 'IMAGE TO VIDEO' : catUpper === 'T2I' ? 'TEXT TO IMAGE' : catUpper,
        originalPrice: `$${((m.credits_per_unit || 15) * 0.001 * 1.2).toFixed(3)}`,
        price: `$${((m.credits_per_unit || 15) * 0.001).toFixed(3)}`,
        discount: '11%',
        description: `High-fidelity ${m.modality || 'multimodal'} generative pipeline powered by ${m.provider || 'Timecapsule'}. Supports full batch automation.`,
        provider: m.provider || 'timecapsule',
        thumb: CINEMA_THUMBNAILS[idx % CINEMA_THUMBNAILS.length],
      };
    });

    const combined = [...CURATED_MODELS];
    for (const item of mappedApi) {
      if (!combined.some((c) => c.id === item.id)) {
        combined.push(item);
      }
    }
    return combined;
  }, [catalog]);

  const filteredModels = useMemo(() => {
    return allModels.filter((m) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        m.name.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (selectedCategory === 'all') return true;
      if (selectedCategory === 'i2v') return m.category.includes('IMAGE TO VIDEO');
      if (selectedCategory === 't2v') return m.category.includes('TEXT TO VIDEO');
      if (selectedCategory === 't2i') return m.category.includes('TEXT TO IMAGE');
      if (selectedCategory === 'i2i') return m.category.includes('IMAGE EDITING');
      if (selectedCategory === 'audio') return m.category.includes('AUDIO');
      if (selectedCategory === 'lipsync') return m.category.includes('LIP');
      return true;
    });
  }, [allModels, search, selectedCategory]);

  return (
    <div className="min-h-screen bg-[#070709] text-white flex flex-col font-sans">
      <PlatformNav activeModule="explore" />

      {/* Main Container - Exact Muapi Alignment */}
      <div className="max-w-[1440px] w-full mx-auto px-6 lg:px-8 py-6 flex-1 flex flex-col">
        {/* Hero Announcement Billboard */}
        <section className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-[#121217] p-8 md:p-12 mb-8 shadow-2xl">
          {/* Subtle Studio Lighting Backdrop */}
          <div className="absolute inset-0 bg-gradient-to-r from-black via-zinc-950/80 to-transparent pointer-events-none z-0" />
          <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-blue-600 text-white font-extrabold text-[10px] tracking-wider uppercase px-2.5 py-1 rounded">
                NEW RELEASE
              </span>
              <span className="bg-zinc-800 text-zinc-400 font-bold text-[10px] px-2.5 py-1 rounded border border-zinc-700/60">
                V12
              </span>
              <ModuleStatusBadge status="working" />
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight uppercase leading-none mb-4">
              🎬 SEEDANCE 2.5 AT A 28% DISCOUNT — NOW LIVE ON TIMECAPSULE!
            </h1>

            <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed mb-6 max-w-2xl font-normal">
              ByteDance's next-gen Seedance 2.5 is available on Timecapsule, with text-to-video, image-to-video, first/last-frame, and multi-reference (Omni) endpoints. Generate up to 30-second clips at 480p/720p, starting from $0.17/sec — up to 28% cheaper than other providers.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedCategory('t2v')}
                className="bg-white hover:bg-zinc-200 text-black font-extrabold text-xs px-6 py-2.5 rounded-lg transition-colors uppercase tracking-wider shadow-lg"
              >
                EXPLORE COLLECTION
              </button>
              <Link
                href="/studio?preview=1"
                className="bg-zinc-800/90 hover:bg-zinc-700 text-white font-bold text-xs px-6 py-2.5 rounded-lg border border-zinc-700 transition-colors uppercase tracking-wider"
              >
                TRY IN STUDIO
              </Link>
            </div>
          </div>

          {/* Carousel Pagination Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="w-2 h-2 rounded-full bg-zinc-600" />
            <span className="w-2 h-2 rounded-full bg-zinc-600" />
          </div>
        </section>

        {/* Full-Width Search Bar */}
        <div className="w-full bg-[#121216] border border-zinc-800 focus-within:border-zinc-700 rounded-xl px-4 py-3 flex items-center gap-3 text-sm text-zinc-300 mb-4 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-500">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search models..."
            className="bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none w-full font-normal"
          />
        </div>

        {/* Category Tag Cloud Row 1 (Provider/Family) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 text-xs">
          {PROVIDER_TAGS.map((tag) => (
            <button
              key={tag.name}
              onClick={() => setSearch(tag.name.replace(' Models', ''))}
              className="bg-[#131317] hover:bg-[#1c1c22] border border-zinc-800 text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap"
            >
              <span>{tag.icon}</span>
              <span>{tag.name}</span>
            </button>
          ))}
          <button
            onClick={() => setSearch('')}
            className="text-blue-400 hover:text-blue-300 text-xs font-semibold whitespace-nowrap px-2"
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
              className="bg-[#131317] hover:bg-[#1c1c22] border border-zinc-800 text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all whitespace-nowrap"
            >
              <span>{tag.icon}</span>
              <span>{tag.name}</span>
            </button>
          ))}
        </div>

        {/* Top Category Tabs */}
        <div className="flex items-center gap-2 my-4 border-b border-zinc-800/80 pb-3">
          <button
            onClick={() => setActiveMainTab('models')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeMainTab === 'models'
                ? 'bg-blue-600 text-white'
                : 'bg-[#131317] text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            AI Models <span className="opacity-80">622</span>
          </button>
          <button
            onClick={() => setActiveMainTab('lead')}
            className="bg-[#131317] text-zinc-400 hover:text-white border border-zinc-800 px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all"
          >
            Lead Enrichment <span className="opacity-60">20</span>
          </button>
          <button
            onClick={() => setActiveMainTab('seo')}
            className="bg-[#131317] text-zinc-400 hover:text-white border border-zinc-800 px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all"
          >
            SEO <span className="opacity-60">28</span>
          </button>
          <button
            onClick={() => setActiveMainTab('social')}
            className="bg-[#131317] text-zinc-400 hover:text-white border border-zinc-800 px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all"
          >
            Social <span className="opacity-60">10</span>
          </button>
          <button
            onClick={() => setActiveMainTab('scraping')}
            className="bg-[#131317] text-zinc-400 hover:text-white border border-zinc-800 px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all"
          >
            Scraping <span className="opacity-60">4</span>
          </button>
        </div>

        {/* 2-Column Explorer Section - Exact Muapi Two-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8 mt-2">
          {/* Left Sidebar: CATEGORY filter */}
          <aside className="w-full shrink-0">
            <h3 className="text-white font-bold text-xs uppercase tracking-wider">Category</h3>
            <p className="text-zinc-500 text-xs mt-0.5 mb-4">
              Showing {filteredModels.length} of {allModels.length} models
            </p>

            <div className="space-y-1">
              {CATEGORIES_FACET.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                      isSelected
                        ? 'bg-zinc-800/80 text-white font-semibold'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[10px] ${
                          isSelected
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'border-zinc-700 bg-zinc-900'
                        }`}
                      >
                        {isSelected && '✓'}
                      </span>
                      <span>{cat.label}</span>
                    </div>
                    <span className="text-zinc-500 text-[11px] font-mono">{cat.count}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Right Main Grid: FEATURED MODELS */}
          <main className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold text-sm uppercase tracking-wider">Featured Models</h2>
              <div className="flex items-center gap-2">
                <span className="bg-[#121216] border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-300 flex items-center gap-2 cursor-pointer">
                  <span>Newly Added</span>
                  <span className="text-[10px] text-zinc-500">▾</span>
                </span>
              </div>
            </div>

            {/* 2-Column Horizontal Cards Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {filteredModels.map((m) => (
                <div
                  key={m.id}
                  className="bg-[#111116] hover:bg-[#15151c] border border-zinc-800/80 hover:border-zinc-700 rounded-xl overflow-hidden flex flex-row transition-all duration-150 group cursor-pointer h-36 sm:h-40 relative"
                >
                  {/* Left Thumbnail Image */}
                  <div className="w-36 sm:w-44 shrink-0 h-full relative overflow-hidden bg-zinc-900">
                    <img
                      src={m.thumb}
                      alt={m.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {m.discount && (
                      <span className="absolute top-2 left-2 bg-[#e6fc15] text-black font-black text-[10px] px-1.5 py-0.5 rounded shadow">
                        {m.discount}
                      </span>
                    )}
                  </div>

                  {/* Right Details */}
                  <div className="p-3.5 flex flex-col justify-between flex-1 min-w-0">
                    <div>
                      {/* Top Category & Pricing */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-blue-400 tracking-wider uppercase truncate">
                          {m.category}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0 text-xs">
                          {m.originalPrice && (
                            <span className="line-through text-zinc-500 font-mono text-[11px]">
                              {m.originalPrice}
                            </span>
                          )}
                          <span className="text-emerald-400 font-bold font-mono">
                            {m.price}
                          </span>
                        </div>
                      </div>

                      {/* Title */}
                      <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors truncate mt-1">
                        {m.name}
                      </h4>

                      {/* Description */}
                      <p className="text-xs text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                        {m.description}
                      </p>
                    </div>

                    {/* Bottom Metadata & Action */}
                    <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 text-[11px] text-zinc-500">
                      <span className="truncate">Provider: <span className="text-zinc-300">{m.provider}</span></span>
                      <Link
                        href="/studio?preview=1"
                        className="text-blue-400 hover:text-blue-300 font-semibold text-xs flex items-center gap-1"
                      >
                        Try Model →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>

        {/* Browse AI Models by Category Section */}
        <section className="mt-16 pt-10 border-t border-zinc-800/80">
          <h2 className="text-white font-bold text-base mb-6">Browse AI Models by Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-xs">
            {/* Text to Image */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold">Text to Image</h3>
                <span className="text-zinc-500 hover:text-zinc-300 cursor-pointer">View all →</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Nano Banana', 'Gpt Image 2 Text To Image', 'Flux Schnell', 'Ideogram V3 T2I',
                  'Nano Banana 2', 'Nano Banana Pro', 'Flux Dev', 'Z Image Turbo', 'Bytedance Seedream 5.0 Pro'
                ].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSearch(tag)}
                    className="bg-[#121216] border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white px-2.5 py-1 rounded text-[11px]"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Text to Video */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold">Text to Video</h3>
                <span className="text-zinc-500 hover:text-zinc-300 cursor-pointer">View all →</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Seedance Lite T2v', 'Seedance 2 T2v', 'Seedance 2 Mini Omni Reference', 'Wan3.0 Spicy Text To Video',
                  'Grok Imagine Text To Video', 'Seedance 2.5 Text To Video', 'Kling V3.0 Standard Text To Video', 'Wan2.2 Text To Video'
                ].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSearch(tag)}
                    className="bg-[#121216] border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white px-2.5 py-1 rounded text-[11px]"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Image to Video */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold">Image to Video</h3>
                <span className="text-zinc-500 hover:text-zinc-300 cursor-pointer">View all →</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Grok Imagine Image To Video', 'Seedance 2.5 Omni Reference', 'Seedance 2.5 Spicy Omni Reference',
                  'Wan3.0 Spicy Reference To Video', 'Wan3.0 Reference To Video', 'Kling V3.0 Pro Image To Video', 'Seedance 2 I2v'
                ].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSearch(tag)}
                    className="bg-[#121216] border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white px-2.5 py-1 rounded text-[11px]"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      <PlatformFooter />
    </div>
  );
}
