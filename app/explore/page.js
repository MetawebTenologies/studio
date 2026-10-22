'use client';

import { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import BrandIcon from '@/components/BrandIcon';

const PROVIDER_TAGS = [
  { name: 'LLM', icon: 'speech' },
  { name: 'Gemini Omni', icon: 'google' },
  { name: 'HappyHorse', icon: 'sparkle' },
  { name: 'Seedance 2', icon: 'seedance' },
  { name: 'GPT Image', icon: 'openai' },
  { name: 'Veo 3.1', icon: 'veo' },
  { name: 'Nano Banana', icon: 'banana' },
  { name: 'Midjourney', icon: 'midjourney' },
  { name: 'Suno', icon: 'audio' },
  { name: 'Wan 2.7', icon: 'wan' },
  { name: 'Qwen', icon: 'qwen' },
  { name: 'Grok', icon: 'bolt' },
  { name: 'Vidu', icon: 'vidu' },
  { name: 'Seedance 1.5', icon: 'seedance' },
  { name: 'Wan 2.6', icon: 'wan' },
  { name: 'OpenAI', icon: 'openai' },
  { name: 'Seedream', icon: 'seedance' },
  { name: 'Flux', icon: 'flux' },
  { name: 'Minimax Hailuo', icon: 'minimax' },
  { name: 'Kling', icon: 'kling' },
  { name: 'Google', icon: 'google' },
];

const TASK_TAGS = [
  { name: 'Upscale Image', icon: 'expand' },
  { name: 'Upscale Video', icon: 'video' },
  { name: 'Faceswap', icon: 'swap' },
  { name: 'Background Remover', icon: 'scissor' },
  { name: 'Product', icon: 'product' },
  { name: 'Image Extension', icon: 'expand' },
  { name: 'Skin Enhancer', icon: 'person' },
  { name: 'Color Photo', icon: 'palette' },
  { name: 'LoRA', icon: 'lora' },
  { name: 'Ghibli Style', icon: 'palette' },
  { name: 'Object Eraser', icon: 'eraser' },
  { name: 'Lipsync', icon: 'lipsync' },
  { name: 'Watermark', icon: 'watermark' },
  { name: 'Social Scrapper', icon: 'social' },
  { name: 'Social Media Publish', icon: 'rocket' },
  { name: 'SEO', icon: 'chart' },
];

const CATEGORIES_FACET = [
  { id: 'all', label: 'All Categories', count: 627 },
  { id: 'i2v', label: 'Image to Video', count: 140 },
  { id: 't2v', label: 'Text to Video', count: 93 },
  { id: 'llm', label: 'Text Generation', count: 92 },
  { id: 'i2i', label: 'Image Editing', count: 81 },
  { id: 't2i', label: 'Text to Image', count: 76 },
  { id: 'llm_core', label: 'LLM', count: 51 },
  { id: 'audio', label: 'AI Audio', count: 25 },
  { id: 'lora', label: 'LoRA Support', count: 17 },
  { id: 'training', label: 'Training', count: 13 },
  { id: 'lipsync', label: 'Lipsync', count: 13 },
  { id: '3d', label: 'Image to 3D', count: 7 },
  { id: 'other', label: 'other', count: 6 },
  { id: 't3d', label: 'Text to 3D', count: 3 },
];

function ModelVisualCard({ model }) {
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef(null);

  const isVideo =
    model.catId === 't2v' ||
    model.catId === 'i2v' ||
    ['veo', 'seedance', 'wan', 'kling', 'minimax', 'vidu', 'runway', 'luma'].includes(model.family);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (isVideo && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (isVideo && videoRef.current) {
      videoRef.current.pause();
    }
  };

  const getGradientAndIcon = (family) => {
    switch (family) {
      case 'flux':
        return {
          gradient: 'from-[#2e0854] via-[#1a0933] to-[#0c1b33]',
          accent: '#9b8cff',
          tag: 'FLUX',
          icon: 'flux',
          sample: '/samples/sample_image_1.webp',
        };
      case 'veo':
        return {
          gradient: 'from-[#0b1a3a] via-[#081226] to-[#050b14]',
          accent: '#00e5ff',
          tag: 'VEO 3.1',
          icon: 'veo',
          sample: '/samples/demo.mp4',
        };
      case 'seedance':
        return {
          gradient: 'from-[#062c24] via-[#051c17] to-[#04110e]',
          accent: '#10b981',
          tag: 'SEEDANCE',
          icon: 'seedance',
          sample: '/samples/demo.mp4',
        };
      case 'nano-banana':
        return {
          gradient: 'from-[#3b2405] via-[#221503] to-[#0e0901]',
          accent: '#f59e0b',
          tag: 'NANO',
          icon: 'banana',
          sample: '/samples/sample_image_1.webp',
        };
      case 'lyria':
      case 'audio':
        return {
          gradient: 'from-[#290d3d] via-[#170724] to-[#0a0312]',
          accent: '#c084fc',
          tag: 'AUDIO',
          icon: 'audio',
          sample: '/samples/sample_image_2.webp',
        };
      case 'ideogram':
        return {
          gradient: 'from-[#1f2937] via-[#111827] to-[#030712]',
          accent: '#38bdf8',
          tag: 'IDEOGRAM',
          icon: 'ideogram',
          sample: '/samples/sample_banner.png',
        };
      case 'wan':
        return {
          gradient: 'from-[#0f172a] via-[#1e293b] to-[#020617]',
          accent: '#60a5fa',
          tag: 'WAN 2.2',
          icon: 'wan',
          sample: '/samples/demo.mp4',
        };
      case 'kling':
        return {
          gradient: 'from-[#24123a] via-[#140b20] to-[#09040e]',
          accent: '#ec4899',
          tag: 'KLING',
          icon: 'kling',
          sample: '/samples/demo.mp4',
        };
      case 'openai':
        return {
          gradient: 'from-[#062d22] via-[#031c15] to-[#020d0a]',
          accent: '#10b981',
          tag: 'OPENAI',
          icon: 'openai',
          sample: '/samples/sample_image_2.webp',
        };
      case 'midjourney':
        return {
          gradient: 'from-[#2e0854] via-[#3b0764] to-[#1e1b4b]',
          accent: '#e879f9',
          tag: 'MIDJOURNEY',
          icon: 'midjourney',
          sample: '/samples/sample_image_1.webp',
        };
      default:
        return {
          gradient: 'from-[#181820] via-[#121217] to-[#09090b]',
          accent: '#00e5ff',
          tag: 'STUDIO',
          icon: 'studio',
          sample: '/samples/sample_image_1.webp',
        };
    }
  };

  const style = getGradientAndIcon(model.family);

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`w-full h-full bg-gradient-to-br ${style.gradient} flex flex-col justify-between p-3 relative overflow-hidden select-none transition-all duration-300`}
    >
      {/* 1. Video Hover Preview Layer (P5) */}
      {isVideo && (
        <video
          ref={videoRef}
          src="/samples/demo.mp4"
          muted
          loop
          playsInline
          preload="metadata"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 z-10 ${
            isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        />
      )}

      {/* 2. High-Res Image Hover Preview Layer (for Image Models) */}
      {!isVideo && style.sample && (
        <img
          src={style.sample}
          alt={model.name}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 z-10 ${
            isHovered ? 'opacity-90 scale-105' : 'opacity-0 pointer-events-none'
          }`}
        />
      )}

      {/* Subtle atmospheric visual glow */}
      <div
        className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full blur-xl opacity-30 pointer-events-none"
        style={{ backgroundColor: style.accent }}
      />

      {/* Top right icon & Live Preview Badge */}
      <div className="flex justify-between items-center z-20">
        <span
          className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded transition-opacity duration-200 ${
            isHovered
              ? 'bg-blue-600 text-white opacity-100 shadow-xs'
              : 'opacity-0'
          }`}
        >
          {isVideo ? 'Loop' : 'Preview'}
        </span>
        <div className="w-5 h-5 rounded flex items-center justify-center bg-black/40 backdrop-blur-xs border border-white/10">
          <BrandIcon name={style.icon} className="w-3 h-3 text-white/90" />
        </div>
      </div>

      {/* Center Graphic Motif (visible when not hovered) */}
      <div
        className={`flex items-center justify-center my-auto transition-opacity duration-300 ${
          isHovered ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div
          className="w-12 h-12 rounded-lg border border-white/10 flex items-center justify-center shadow-inner"
          style={{ backgroundColor: `${style.accent}15` }}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke={style.accent} strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="3" opacity="0.4" />
            <path d="M7 8h10M7 12h7M7 16h4" />
          </svg>
        </div>
      </div>

      {/* Bottom Model Family Tag */}
      <div className="flex items-center justify-between z-20 pt-1">
        <span
          className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border border-white/10 bg-black/60 backdrop-blur-xs"
          style={{ color: style.accent }}
        >
          {style.tag}
        </span>
        <span className="text-[9px] font-mono text-zinc-400 opacity-80">
          {isVideo ? 'VIDEO' : 'AI'}
        </span>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [activeMainTab, setActiveMainTab] = useState('models');

  // Authoritative 24 featured models matching high-fidelity marketplace reference
  const allModels = useMemo(() => [
    {
      id: 'flux-3-klein-edit-image',
      name: 'flux-3-klein-edit-image',
      category: 'IMAGE EDITING',
      catId: 'i2i',
      price: '$0.009',
      originalPrice: '$0.0108',
      discount: '11%',
      provider: 'Black Forest Labs',
      family: 'flux',
      description: 'Edit reference images with Black Forest Labs FLUX 3 Klein using precise prompt instructions.',
    },
    {
      id: 'flux-3-klein-text-to-image',
      name: 'flux-3-klein-text-to-image',
      category: 'TEXT TO IMAGE',
      catId: 't2i',
      price: '$0.009',
      originalPrice: '$0.0108',
      discount: '11%',
      provider: 'Black Forest Labs',
      family: 'flux',
      description: 'Generate photorealistic images with Black Forest Labs FLUX 3 Klein via asynchronous API. Choose 1K, 2K, or 4K.',
    },
    {
      id: 'seedance-2-5-pro-t2v',
      name: 'seedance-2-5-pro-t2v',
      category: 'TEXT TO VIDEO',
      catId: 't2v',
      price: '$0.170',
      originalPrice: '$0.2400',
      discount: '28%',
      provider: 'ByteDance',
      family: 'seedance',
      description: 'ByteDance next-gen Seedance 2.5 with cinematic multi-camera motion consistency and 720p output.',
    },
    {
      id: 'veo-3-1-fast-text-to-video',
      name: 'veo-3-1-fast-text-to-video',
      category: 'TEXT TO VIDEO',
      catId: 't2v',
      price: '$0.150',
      originalPrice: '$0.1800',
      discount: '17%',
      provider: 'Google DeepMind',
      family: 'veo',
      description: 'Google Veo 3.1 cinematic text-to-video with photorealistic lighting and director-level camera controls.',
    },
    {
      id: 'nano-banana-pro',
      name: 'nano-banana-pro',
      category: 'TEXT TO IMAGE',
      catId: 't2i',
      price: '$0.015',
      originalPrice: '$0.0200',
      discount: '25%',
      provider: 'Google',
      family: 'nano-banana',
      description: 'Ultra-fast high-detail portrait and cinematic character engine with verified idempotency ledger.',
    },
    {
      id: 'wan-2-2-speech-to-video',
      name: 'wan-2-2-speech-to-video',
      category: 'LIP SYNC',
      catId: 'lipsync',
      price: '$0.120',
      originalPrice: '$0.1500',
      discount: '20%',
      provider: 'Alibaba',
      family: 'wan',
      description: 'Precise phoneme-to-viseme lip synchronization supporting multi-lingual vocal tracks and realistic head motion.',
    },
    {
      id: 'lyria-3-pro',
      name: 'lyria-3-pro',
      category: 'AI AUDIO',
      catId: 'audio',
      price: '$0.080',
      originalPrice: '$0.0888',
      discount: '11%',
      provider: 'Google DeepMind',
      family: 'lyria',
      description: 'Google flagship music model: describe genre, mood, instruments, and arrangement structure for full compositions.',
    },
    {
      id: 'fish-s2-1-pro',
      name: 'fish-s2-1-pro',
      category: 'AI AUDIO',
      catId: 'audio',
      price: '$0.015',
      originalPrice: '$0.0167',
      discount: '11%',
      provider: 'Fish Audio',
      family: 'audio',
      description: 'Fish Audio S2.1 Pro is a high-fidelity text-to-speech model built for long-form narration. Up to 10,000 characters.',
    },
    {
      id: 'elevenlabs-v4',
      name: 'elevenlabs-v4',
      category: 'AI AUDIO',
      catId: 'audio',
      price: '$0.080',
      originalPrice: '$0.0888',
      discount: '11%',
      provider: 'ElevenLabs',
      family: 'audio',
      description: 'Eleven v4 text-to-speech engine delivering nuanced expressive narration with multi-lingual voice cloning.',
    },
    {
      id: 'ideogram-v4',
      name: 'ideogram-v4',
      category: 'TEXT TO IMAGE',
      catId: 't2i',
      price: '$0.060',
      originalPrice: '$0.0667',
      discount: '11%',
      provider: 'Ideogram',
      family: 'ideogram',
      description: 'Ideogram 4.0 generation engine, optimized for clean typographic rendering, logos, and graphic layouts.',
    },
    {
      id: 'midjourney-v7',
      name: 'midjourney-v7',
      category: 'TEXT TO IMAGE',
      catId: 't2i',
      price: '$0.050',
      originalPrice: '$0.0556',
      discount: '10%',
      provider: 'Midjourney',
      family: 'midjourney',
      description: 'Midjourney flagship image synthesis with nuanced artistic composition, photoreal skin texture, and aesthetic coherence.',
    },
    {
      id: 'kling-v3-pro-t2v',
      name: 'kling-v3-pro-t2v',
      category: 'TEXT TO VIDEO',
      catId: 't2v',
      price: '$0.140',
      originalPrice: '$0.1650',
      discount: '15%',
      provider: 'Kuaishou',
      family: 'kling',
      description: 'Kling v3 Pro text-to-video delivering fluid physics simulation, 1080p resolution, and expressive character acting.',
    },
    {
      id: 'seedance-pro-t2v',
      name: 'seedance-pro-t2v',
      category: 'TEXT TO VIDEO',
      catId: 't2v',
      price: '$0.015',
      originalPrice: '$0.018',
      discount: '11%',
      provider: 'ByteDance',
      family: 'seedance',
      description: 'High-fidelity video generative pipeline with full batch automation and responsive cue framing.',
    },
    {
      id: 'veo3.1-fast-text-to-video',
      name: 'veo3.1-fast-text-to-video',
      category: 'TEXT TO VIDEO',
      catId: 't2v',
      price: '$0.015',
      originalPrice: '$0.018',
      discount: '11%',
      provider: 'Google DeepMind',
      family: 'veo',
      description: 'High-speed generative video pipeline featuring Google Veo 3.1 motion coherence and fast turnaround.',
    },
    {
      id: 'nano-banana-pro-edit',
      name: 'nano-banana-pro-edit',
      category: 'IMAGE EDITING',
      catId: 'i2i',
      price: '$0.015',
      originalPrice: '$0.018',
      discount: '11%',
      provider: 'Google',
      family: 'nano-banana',
      description: 'High-fidelity image-to-image generative editing with sub-second turnaround and prompt masking.',
    },
    {
      id: 'seedance-pro-i2v',
      name: 'seedance-pro-i2v',
      category: 'IMAGE TO VIDEO',
      catId: 'i2v',
      price: '$0.015',
      originalPrice: '$0.018',
      discount: '11%',
      provider: 'ByteDance',
      family: 'seedance',
      description: 'High-fidelity image-to-video generative pipeline with precise camera translation trajectories.',
    },
    {
      id: 'veo3.1-fast-image-to-video',
      name: 'veo3.1-fast-image-to-video',
      category: 'IMAGE TO VIDEO',
      catId: 'i2v',
      price: '$0.015',
      originalPrice: '$0.018',
      discount: '11%',
      provider: 'Google DeepMind',
      family: 'veo',
      description: 'Direct photo-to-motion generative synthesis with realistic lighting continuity and camera panning.',
    },
    {
      id: 'infinitetalk-image-to-video',
      name: 'infinitetalk-image-to-video',
      category: 'LIPSYNC',
      catId: 'lipsync',
      price: '$0.015',
      originalPrice: '$0.018',
      discount: '11%',
      provider: 'InfiniteTalk',
      family: 'wan',
      description: 'High-fidelity lipsync generative pipeline with authentic eye contact and micro-expression preservation.',
    },
    {
      id: 'lyria-2',
      name: 'lyria-2',
      category: 'AI AUDIO',
      catId: 'audio',
      price: '$0.060',
      originalPrice: '$0.0687',
      discount: '11%',
      provider: 'Google DeepMind',
      family: 'lyria',
      description: 'Google Instrumental music generation model. Describe the style and mood in a prompt and get studio-grade audio.',
    },
    {
      id: 'lyria-3',
      name: 'lyria-3',
      category: 'AI AUDIO',
      catId: 'audio',
      price: '$0.040',
      originalPrice: '$0.0444',
      discount: '10%',
      provider: 'Google DeepMind',
      family: 'lyria',
      description: 'High-fidelity short music clips of up to 30 seconds for creative transitions, themes, and intros.',
    },
    {
      id: 'flux-1-dev',
      name: 'flux-1-dev',
      category: 'TEXT TO IMAGE',
      catId: 't2i',
      price: '$0.025',
      originalPrice: '$0.028',
      discount: '11%',
      provider: 'Black Forest Labs',
      family: 'flux',
      description: '12B parameter rectified flow transformer for exceptional typography, complex composition, and photorealism.',
    },
    {
      id: 'suno-v4',
      name: 'suno-v4',
      category: 'AI AUDIO',
      catId: 'audio',
      price: '$0.050',
      originalPrice: '$0.060',
      discount: '15%',
      provider: 'Suno',
      family: 'audio',
      description: 'Full-song generation with coherent vocal arrangements, multi-genre production styles, and master-quality mixing.',
    },
    {
      id: 'wan-2-7-t2v',
      name: 'wan-2-7-t2v',
      category: 'TEXT TO VIDEO',
      catId: 't2v',
      price: '$0.090',
      originalPrice: '$0.105',
      discount: '14%',
      provider: 'Alibaba',
      family: 'wan',
      description: 'Alibaba Wan 2.7 generative video model supporting dense prompt guidance, cinematic motion, and native 720p output.',
    },
    {
      id: 'gpt-4o-image',
      name: 'gpt-4o-image',
      category: 'IMAGE EDITING',
      catId: 'i2i',
      price: '$0.040',
      originalPrice: '$0.045',
      discount: '11%',
      provider: 'OpenAI',
      family: 'openai',
      description: 'Multimodal image editing engine powered by GPT-4o with semantic inpainting and contextual instruction comprehension.',
    },
  ], []);

  const filteredModels = useMemo(() => {
    return allModels.filter((m) => {
      const matchesCat =
        selectedCategory === 'all' ||
        m.catId === selectedCategory ||
        (selectedCategory === 'i2v' && m.catId === 'i2v') ||
        (selectedCategory === 't2v' && (m.catId === 't2v' || m.catId === 'i2v'));

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
    <div className="min-h-screen bg-[var(--tc-bg-page,#09090b)] text-[var(--tc-text-primary,#f5f7fa)] flex flex-col font-sans transition-colors">
      <PlatformNav activeModule="explore" />

      <main className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 xl:px-0 py-6 flex-1 flex flex-col">
        {/* Full-Bleed Cinematic Hero Banner ~380-420px tall (R0.5 Spec) */}
        <div className="w-full min-h-[380px] sm:min-h-[400px] rounded-lg relative overflow-hidden border border-white/10 bg-[#070709] p-8 sm:p-10 lg:p-12 mb-6 flex flex-col justify-between shadow-2xl">
          {/* Subtle cinematic gradient and film portal aura */}
          <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-blue-600/25 via-indigo-600/15 to-transparent pointer-events-none" />
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

          {/* Background Grid Accent */}
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              {/* Badges: [NEW RELEASE blue pill] and [V12 gray pill] */}
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2.5 py-1 rounded bg-blue-600/30 text-blue-400 text-[10px] font-black uppercase tracking-widest border border-blue-500/40 shadow-xs">
                  New Release
                </span>
                <span className="px-2.5 py-1 rounded bg-white/10 text-zinc-300 text-[10px] font-bold uppercase tracking-wider border border-white/20 shadow-xs">
                  v12
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/40 ml-1">
                  Working
                </span>
              </div>

              {/* Cinematic 3D Product Headline */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight text-white max-w-3xl leading-snug drop-shadow-sm flex flex-wrap items-center gap-3">
                <span>Seedance 2.5 Native Cinematic Video</span>
                <span className="text-[#00e5ff] font-mono text-xs sm:text-sm tracking-widest font-bold">/ NOW LIVE</span>
              </h1>

              {/* 2-line Description */}
              <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl leading-relaxed mt-3">
                ByteDance&apos;s next-generation Seedance 2.5 engine is integrated into Timecapsule with text-to-video, image-to-video, first/last-frame directing, and multi-reference camera motion. Generate high-fidelity cinematic shots with consistent motion framing.
              </p>
            </div>

            {/* Action Buttons: Solid White "Explore Collection" + Outlined "Try in Studio" */}
            <div className="flex flex-wrap items-center gap-3 mt-8">
              <Link
                href="/explore"
                data-keep-light="true"
                className="px-5 py-3 bg-white text-black font-black text-xs uppercase tracking-widest hover:bg-[#00e5ff] hover:text-black transition-all duration-200 rounded-sm shadow-md"
              >
                Explore Collection
              </Link>
              <Link
                href="/studio?preview=1"
                className="px-5 py-3 bg-transparent text-white font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-all duration-200 rounded-sm border border-white/30"
              >
                Try in Studio
              </Link>
            </div>
          </div>
        </div>

        {/* Global Search Bar (Large Rounded Dark Surface Input) */}
        <div className="w-full relative mb-3">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500">
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
            className="w-full h-12 bg-[#121217] border border-white/10 rounded-[4px] pl-11 pr-4 text-sm text-[#f5f7fa] placeholder:text-zinc-500 focus:outline-none focus:border-[#00e5ff] shadow-xs transition-colors"
          />
        </div>

        {/* Chip System Group 1 (Provider/Model Chips — Dark Surface + Vector Icon) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 text-xs">
          {PROVIDER_TAGS.map((tag) => (
            <button
              key={tag.name}
              onClick={() => setSearch(tag.name)}
              className="bg-[#121217] hover:bg-[#181820] border border-white/10 text-zinc-300 hover:text-[#f5f7fa] hover:border-[#00e5ff]/50 px-3 py-1.5 rounded-full flex items-center gap-2 transition-all whitespace-nowrap shadow-xs text-[11px] font-semibold group cursor-pointer"
            >
              <BrandIcon name={tag.icon} className="w-3.5 h-3.5 text-zinc-400 group-hover:text-[#00e5ff] transition-colors" />
              <span>{tag.name}</span>
            </button>
          ))}
          <button
            onClick={() => setSearch('')}
            className="text-[#00e5ff] hover:text-cyan-300 text-xs font-semibold whitespace-nowrap px-2 cursor-pointer transition-colors"
          >
            See all providers →
          </button>
        </div>

        {/* Chip System Group 2 (Tool Chips — Dark Surface + Vector Icon) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-4 text-xs">
          {TASK_TAGS.map((tag) => (
            <button
              key={tag.name}
              onClick={() => setSearch(tag.name)}
              className="bg-[#121217] hover:bg-[#181820] border border-white/10 text-zinc-300 hover:text-[#f5f7fa] hover:border-[#00e5ff]/50 px-3 py-1.5 rounded-full flex items-center gap-2 transition-all whitespace-nowrap shadow-xs text-[11px] font-semibold group cursor-pointer"
            >
              <BrandIcon name={tag.icon} className="w-3.5 h-3.5 text-zinc-400 group-hover:text-[#00e5ff] transition-colors" />
              <span>{tag.name}</span>
            </button>
          ))}
        </div>

        {/* Category Tabs ([AI Models 627] active-blue w/ count, Lead Enrichment 20, SEO 28, Social 10, Scraping 4) */}
        <div className="flex items-center gap-2 my-2 border-b border-white/10 pb-3 overflow-x-auto no-scrollbar">
          <button
            onClick={() => { setActiveMainTab('models'); setSelectedCategory('all'); }}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeMainTab === 'models'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'bg-[#121217] text-zinc-400 hover:text-[#f5f7fa] border border-white/10'
            }`}
          >
            AI Models <span className="opacity-80">627</span>
          </button>
          <button
            onClick={() => { setActiveMainTab('lead'); }}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
              activeMainTab === 'lead'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'bg-[#121217] text-zinc-400 hover:text-[#f5f7fa] border border-white/10'
            }`}
          >
            Lead Enrichment <span className="text-zinc-500">20</span>
          </button>
          <button
            onClick={() => { setActiveMainTab('seo'); }}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
              activeMainTab === 'seo'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'bg-[#121217] text-zinc-400 hover:text-[#f5f7fa] border border-white/10'
            }`}
          >
            SEO <span className="text-zinc-500">28</span>
          </button>
          <button
            onClick={() => { setActiveMainTab('social'); }}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
              activeMainTab === 'social'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'bg-[#121217] text-zinc-400 hover:text-[#f5f7fa] border border-white/10'
            }`}
          >
            Social <span className="text-zinc-500">10</span>
          </button>
          <button
            onClick={() => { setActiveMainTab('scraping'); }}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
              activeMainTab === 'scraping'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'bg-[#121217] text-zinc-400 hover:text-[#f5f7fa] border border-white/10'
            }`}
          >
            Scraping <span className="text-zinc-500">4</span>
          </button>
        </div>

        {/* 2-Column Explorer Section — 220px Facet Sidebar + 1fr Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8 mt-4">
          {/* Left Sidebar: CATEGORY Facet with Counts */}
          <aside className="w-full shrink-0">
            <h3 className="text-[#f5f7fa] font-bold text-xs uppercase tracking-wider">Category</h3>
            <p className="text-zinc-500 text-xs mt-0.5 mb-4">
              Showing {filteredModels.length} of 627 models
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
                        ? 'bg-blue-600/15 text-blue-400 font-bold border border-blue-500/30'
                        : 'text-zinc-400 hover:bg-white/5 hover:text-[#f5f7fa]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span
                        className={`w-4 h-4 rounded-[3px] border flex items-center justify-center text-[10px] font-bold ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-zinc-700 bg-[#121217]'
                        }`}
                      >
                        {isSelected && <BrandIcon name="check" className="w-2.5 h-2.5 text-white" />}
                      </span>
                      <span className="truncate">{cat.label}</span>
                    </div>
                    <span className="text-zinc-500 text-[11px] font-mono">{cat.count}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Right Main Grid: Toolbar Row + Horizontal Cards */}
          <main className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[#f5f7fa] font-bold text-sm uppercase tracking-wider">Featured Models</h2>
              <div className="flex items-center gap-2">
                <span className="bg-[#121217] border border-white/10 rounded-md px-3 py-1.5 text-xs text-zinc-300 flex items-center gap-2 cursor-pointer shadow-xs hover:border-white/20">
                  <span>Newly Added</span>
                  <span className="text-[10px] text-zinc-400">▾</span>
                </span>
              </div>
            </div>

            {/* 2-Column Horizontal Cards Grid — radius ~12px (R0.5 Spec) */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {filteredModels.map((m) => (
                <Link
                  key={m.id}
                  href={`/${m.id}`}
                  className="flex bg-[#121217] border border-white/10 rounded-[12px] overflow-hidden group hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] transition-all duration-300 min-h-[160px]"
                >
                  {/* Left Media Thumbnail (~140px) with Real Generated Art & Discount Badge */}
                  <div className="w-[140px] aspect-square shrink-0 overflow-hidden relative bg-[#181820] flex items-center justify-center">
                    <ModelVisualCard model={m} />
                    {m.discount && (
                      <div className="absolute top-2 left-2 bg-[#D9FF00] text-black text-[10px] font-black px-1.5 py-0.5 rounded-sm shadow-xs z-10">
                        {m.discount}
                      </div>
                    )}
                  </div>

                  {/* Right Details Panel */}
                  <div className="flex-1 p-3.5 sm:p-4 flex flex-col justify-between min-w-0">
                    <div>
                      {/* Top Category & Price Row */}
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[11px] font-bold text-blue-500 uppercase tracking-widest truncate">
                          {m.category}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0 text-xs">
                          {m.originalPrice && (
                            <span className="text-[11px] text-zinc-500 line-through opacity-60 font-bold">
                              {m.originalPrice}
                            </span>
                          )}
                          <span className="text-[13px] font-black text-emerald-400">
                            {m.price}
                          </span>
                        </div>
                      </div>

                      {/* Model Name Heading */}
                      <h2 className="text-[15px] font-bold text-[#f5f7fa] group-hover:text-blue-400 transition-colors leading-tight break-words mt-1">
                        {m.name}
                      </h2>

                      {/* Model Description (2-line) */}
                      <p className="text-[12px] text-zinc-400 line-clamp-2 leading-relaxed font-medium mt-1">
                        {m.description}
                      </p>
                    </div>

                    {/* Footer Provider & Action */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-zinc-500 mt-2">
                      <span className="truncate">
                        Provider: <span className="text-zinc-300 font-semibold">{m.provider}</span>
                      </span>
                      <span className="text-blue-500 group-hover:text-blue-400 font-bold text-xs flex items-center gap-0.5">
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
        <section className="mt-16 pt-10 border-t border-white/10">
          <h2 className="text-[#f5f7fa] font-bold text-base mb-6">Browse AI Models by Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-xs">
            {/* Text to image */}
            <div>
              <div className="flex items-center justify-between mb-3 text-zinc-200 font-semibold">
                <span>Text to image</span>
                <Link href="/explore" className="text-blue-500 hover:underline text-[11px]">View all →</Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {['Nano Banana', 'Gpt Image 2 Text To Image', 'Flux Schnell', 'Ideogram V3 T2I', 'Nano Banana 2', 'Nano Banana Pro', 'Flux Dev', 'Z Image Turbo', 'Bytedance Seedream 5.0 Pro'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setSearch(t)}
                    className="px-2.5 py-1 rounded bg-[#121217] hover:bg-[#181820] border border-white/10 text-zinc-300 hover:text-[#f5f7fa] hover:border-blue-500/50 text-[11px] transition-colors shadow-xs"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Text to Video */}
            <div>
              <div className="flex items-center justify-between mb-3 text-zinc-200 font-semibold">
                <span>Text to Video</span>
                <Link href="/explore" className="text-blue-500 hover:underline text-[11px]">View all →</Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {['Seedance Lite T2v', 'Seedance 2 T2v', 'Seedance 2 Mini Omni Reference', 'Wan3.0 Spicy Text To Video', 'Grok Imagine Text To Video', 'Seedance 2.5 Text To Video', 'Kling V3.0 Standard Text To Video', 'Wan2.2 Text To Video'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setSearch(t)}
                    className="px-2.5 py-1 rounded bg-[#121217] hover:bg-[#181820] border border-white/10 text-zinc-300 hover:text-[#f5f7fa] hover:border-blue-500/50 text-[11px] transition-colors shadow-xs"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Image to Video */}
            <div>
              <div className="flex items-center justify-between mb-3 text-zinc-200 font-semibold">
                <span>Image to Video</span>
                <Link href="/explore" className="text-blue-500 hover:underline text-[11px]">View all →</Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {['Grok Imagine Image To Video', 'Seedance 2.5 Omni Reference', 'Seedance 2.5 Spicy Omni Reference', 'Wan3.0 Spicy Reference To Video', 'Wan3.0 Reference To Video', 'Kling V3.0 Pro Image To Video', 'Seedance 2 I2v'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setSearch(t)}
                    className="px-2.5 py-1 rounded bg-[#121217] hover:bg-[#181820] border border-white/10 text-zinc-300 hover:text-[#f5f7fa] hover:border-blue-500/50 text-[11px] transition-colors shadow-xs"
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
