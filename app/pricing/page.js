'use client';

import { useState } from 'react';
import Link from 'next/link';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import BrandIcon from '@/components/BrandIcon';
import { Button, Badge, Card, Input } from '@/components/ui';

export const CREDIT_PACKS = [
  {
    name: 'Starter Pack',
    price: '$10',
    credits: '10,000 Credits',
    bonus: '0% Bonus',
    desc: 'Perfect for quick tests, prompt exploration, and small creative batches.',
    capacity: '~666 images (1K) or ~83 videos (5s)',
    popular: false,
  },
  {
    name: 'Creator Pack',
    price: '$50',
    credits: '55,000 Credits',
    bonus: '+10% Bonus Compute',
    desc: 'The creators choice for active content creators, game assets, and storyboarding.',
    capacity: '~3,666 images or ~458 videos',
    popular: true,
  },
  {
    name: 'Studio Pro',
    price: '$100',
    credits: '120,000 Credits',
    bonus: '+20% Bonus Compute',
    desc: 'Designed for production studios, agency pipelines, and batch generation.',
    capacity: '~8,000 images or ~1,000 videos',
    popular: false,
  },
  {
    name: 'Production House',
    price: '$500',
    credits: '650,000 Credits',
    bonus: '+30% Bonus Compute',
    desc: 'High-volume generation for automated commercial creative workflows.',
    capacity: '~43,333 images or ~5,416 videos',
    popular: false,
  },
  {
    name: 'Enterprise Fleet',
    price: '$1,000',
    credits: '1,400,000 Credits',
    bonus: '+40% Bonus Compute',
    desc: 'Maximum compute value for enterprise pipelines, game studios, and API resellers.',
    capacity: '~93,333 images or ~11,666 videos',
    popular: false,
  },
];

export const MONTHLY_STUDIO_PLANS = [
  {
    name: 'Studio Scale',
    price: '$3,000',
    period: '/month',
    fastCredits: '4,000,000 Fast Credits',
    relaxed: 'Unlimited Relaxed Generations (Queued)',
    concurrency: '10 Concurrent Tasks',
    desc: 'For growing creative studios generating thousands of assets every week.',
    features: [
      '4,000,000 Fast Priority Credits monthly',
      'Unlimited Relaxed Image Generation (Fair-Use)',
      '10 Concurrent GPU worker pipelines',
      'Filmmaking Suite multi-seat license included',
      'Dedicated Customer Success channel',
    ],
    popular: false,
  },
  {
    name: 'Agency Master',
    price: '$5,000',
    period: '/month',
    fastCredits: '7,500,000 Fast Credits',
    relaxed: 'Unlimited Relaxed Image & Video',
    concurrency: '20 Concurrent Tasks',
    desc: 'For top-tier creative agencies, production houses, and high-frequency video teams.',
    features: [
      '7,500,000 Fast Priority Credits monthly',
      'Unlimited Relaxed Image + Video generation',
      '20 Concurrent GPU worker pipelines',
      'Unlimited team member seats',
      'Shared Studio Media Vault & Asset CDN',
      'Direct Private Slack / Telegram channel',
    ],
    popular: true,
  },
  {
    name: 'Sovereign VIP',
    price: '$10,000',
    period: '/month',
    fastCredits: '16,000,000 Fast Credits',
    relaxed: 'VIP Priority GPU Lane + Unlimited',
    concurrency: '50 Concurrent Tasks',
    desc: 'For enterprise media companies requiring private dedicated lanes and maximum throughput.',
    features: [
      '16,000,000 Fast Priority Credits monthly',
      'VIP Dedicated GPU Priority Queue Lane',
      '50 Concurrent GPU worker pipelines',
      'Custom White-Label domain instance included',
      'Custom model fine-tuning & LoRA hosting support',
      '99.9% Uptime Enterprise SLA guarantee',
    ],
    popular: false,
  },
];

export const BACKER_BENEFITS = [
  {
    title: 'Perpetual Filmmaking Suite (Free Forever)',
    desc: 'All current and future Timecapsule software (Cinema Studio, Storyboarder, Canvas Director, Lipsync Suite) includes $0 monthly subscription fees for life. You only consume compute credits.',
    icon: 'film',
  },
  {
    title: 'Monthly Compounding Compute Dividend',
    desc: 'Every backer receives an automatic recurring refill of 5,000 to 25,000 free compute credits every single month for life.',
    icon: 'sparkles',
  },
  {
    title: 'Sub-Wholesale At-Cost Compute Lane',
    desc: 'Backers generate at vendor cost + 15% rather than standard retail markup (+200%). Your compute credits stretch 2.5x further than standard users.',
    icon: 'trending-up',
  },
  {
    title: '20% Net Platform Margin Revenue Share Pool',
    desc: '20% of net platform margins across all credit top-ups are allocated directly to the Early Seed Community Backer Pool.',
    icon: 'pie-chart',
  },
  {
    title: 'VIP Queue Priority & Roadmap Governance',
    desc: 'Backer tasks jump to the head of provider queues, and backers hold direct voting rights on which new AI models are integrated next.',
    icon: 'shield-check',
  },
];

const MODEL_GROUPS = [
  {
    name: 'Tools & Utilities',
    count: '20 models',
    models: [
      { name: 'ai-image-upscaler', modality: 'IMAGE TO IMAGE', timecapsule: '20 cr ($0.020)', fal: '$0.03 per gen', replicate: '$0.03 per gen', discount: '-33% ↓' },
      { name: 'ai-image-face-swap', modality: 'IMAGE TO IMAGE', timecapsule: '20 cr ($0.020)', fal: '$0.03', replicate: '$0.03', discount: '-33% ↓' },
      { name: 'ai-product-shot', modality: 'IMAGE TO IMAGE', timecapsule: '60 cr ($0.060)', fal: '$0.08', replicate: '$0.08', discount: '-25% ↓' },
      { name: 'ai-skin-enhancer', modality: 'IMAGE TO IMAGE', timecapsule: '10 cr ($0.010)', fal: '$0.015 per gen', replicate: '$0.015 per gen', discount: '-33% ↓' },
      { name: 'ai-background-remover', modality: 'IMAGE TO IMAGE', timecapsule: '10 cr ($0.010)', fal: '$0.02 per gen', replicate: '$0.02 per gen', discount: '-50% ↓' },
    ],
  },
  {
    name: 'Google Veo Series',
    count: '4 models',
    models: [
      { name: 'veo3-image-to-video', modality: 'IMAGE TO VIDEO', timecapsule: '250 cr ($2.50)', fal: '$3.50 per generation', replicate: '$3.50 per generation', discount: '-28% ↓' },
      { name: 'veo3-fast-text-to-video', modality: 'TEXT TO VIDEO', timecapsule: '60 cr ($0.60)', fal: '$0.80 per generation', replicate: '$0.80 per generation', discount: '-25% ↓' },
      { name: 'veo3-text-to-video', modality: 'TEXT TO VIDEO', timecapsule: '250 cr ($2.50)', fal: '$3.50', replicate: '$3.50', discount: '-28% ↓' },
      { name: 'veo3-fast-image-to-video', modality: 'IMAGE TO VIDEO', timecapsule: '60 cr ($0.60)', fal: '$0.80', replicate: '$0.80', discount: '-25% ↓' },
    ],
  },
  {
    name: 'Black Forest Labs Flux',
    count: '11 models',
    models: [
      { name: 'flux-dev', modality: 'TEXT TO IMAGE', timecapsule: '15 cr ($0.015)', fal: '$0.020', replicate: '$0.020', discount: '-25% ↓' },
      { name: 'flux-schnell', modality: 'TEXT TO IMAGE', timecapsule: '5 cr ($0.005)', fal: '$0.008 per generation', replicate: '$0.008 per generation', discount: '-38% ↓' },
      { name: 'flux-3-klein-text-to-image', modality: 'TEXT TO IMAGE', timecapsule: '9 cr ($0.009)', fal: '$0.015', replicate: '$0.015', discount: '-40% ↓' },
      { name: 'flux-3-klein-edit-image', modality: 'IMAGE TO IMAGE', timecapsule: '9 cr ($0.009)', fal: '$0.015', replicate: '$0.015', discount: '-40% ↓' },
    ],
  },
  {
    name: 'ByteDance Seedance 2.5',
    count: '18 models',
    models: [
      { name: 'seedance-2.5-text-to-video', modality: 'TEXT TO VIDEO', timecapsule: '120 cr ($1.20)', fal: '$1.75 per generation', replicate: 'Not available', discount: '-31% ↓' },
      { name: 'seedance-2.5-image-to-video', modality: 'IMAGE TO VIDEO', timecapsule: '120 cr ($1.20)', fal: '$1.75 per generation', replicate: 'Not available', discount: '-31% ↓' },
      { name: 'seedance-2.5-first-last-frame', modality: 'IMAGE TO VIDEO', timecapsule: '180 cr ($1.80)', fal: '$2.50 per generation', replicate: 'Not available', discount: '-28% ↓' },
    ],
  },
  {
    name: 'Audio & Music Synthesis',
    count: '4 models',
    models: [
      { name: 'mmaudio-v2-text-to-audio', modality: 'TEXT TO AUDIO', timecapsule: '10 cr ($0.010)', fal: '$0.02 per generation', replicate: '$0.02 per generation', discount: '-50% ↓' },
      { name: 'lyria-3-music', modality: 'TEXT TO AUDIO', timecapsule: '40 cr ($0.040)', fal: '$0.06 per generation', replicate: '$0.06 per generation', discount: '-33% ↓' },
    ],
  },
];

export default function PricingPage() {
  const [activeTab, setActiveTab] = useState('packs'); // 'packs' | 'monthly' | 'backers' | 'models'
  const [activeModality, setActiveModality] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="min-h-screen bg-[var(--tc-bg-page)] text-[var(--tc-text-primary)] flex flex-col font-sans">
      <PlatformNav activeModule="pricing" />

      <main className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#00e5ff]">
                  Transparent Rate Cards & Tokenomics
                </span>
                <span className="text-zinc-600">•</span>
                <span className="text-[11px] text-zinc-400 font-mono">1,000 Credits = $1.00 USD</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#f5f7fa]">
                Plans, Compute Packs & Economics
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                Zero expiring credits. Multi-provider cascade failover across Fal.ai, Replicate, MuAPI, and Kie.
              </p>
            </div>

            {/* Main Category Switcher */}
            <div className="flex items-center gap-1.5 p-1 bg-[#121217] border border-white/10 rounded-xl self-start sm:self-auto">
              {[
                { id: 'packs', label: 'Credit Top-Ups ($10–$1,000)' },
                { id: 'monthly', label: 'Studio Monthly ($3K–$10K)' },
                { id: 'backers', label: 'Founder Backer Pass' },
                { id: 'models', label: 'Model Rate Cards' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-[#00e5ff] text-[#09090b] shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* TAB 1: CREDIT PACKAGES ($10 - $1,000) */}
        {activeTab === 'packs' && (
          <div className="mb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
              {CREDIT_PACKS.map((pack) => (
                <Card
                  key={pack.name}
                  className={`p-5 flex flex-col justify-between transition-all ${
                    pack.popular
                      ? 'border-[#00e5ff] shadow-[0_0_25px_rgba(0,229,255,0.15)] bg-[#141820]'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-[#f5f7fa] text-xs">{pack.name}</h3>
                      {pack.popular && (
                        <Badge variant="default" className="text-[9px] px-1.5 py-0.5">
                          POPULAR
                        </Badge>
                      )}
                    </div>
                    <div className="text-3xl font-black font-mono text-[#f5f7fa] mb-1">{pack.price}</div>
                    <div className="text-xs font-bold text-[#00e5ff] font-mono mb-1">{pack.credits}</div>
                    <div className="text-[10px] font-semibold text-emerald-400 font-mono mb-3">{pack.bonus}</div>
                    <p className="text-[11px] text-zinc-400 mb-3 leading-relaxed">{pack.desc}</p>
                    <div className="p-2 rounded bg-black/40 border border-white/5 text-[10px] text-zinc-300 font-mono">
                      {pack.capacity}
                    </div>
                  </div>
                  <Link
                    href="/billing"
                    className={`mt-4 block text-center py-2.5 rounded text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      pack.popular
                        ? 'bg-[#00e5ff] hover:bg-[#38bdf8] text-[#09090b]'
                        : 'bg-white/10 hover:bg-white/15 text-white'
                    }`}
                  >
                    Purchase Credits
                  </Link>
                </Card>
              ))}
            </div>

            {/* Benefit Callout Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 bg-[#121217] border border-white/10 rounded-2xl">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#00e5ff]/10 border border-[#00e5ff]/30 flex items-center justify-center text-[#00e5ff] flex-shrink-0">
                  <BrandIcon name="check" className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Credits Never Expire</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Your balance rolls over indefinitely with zero penalty or decay.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
                  <BrandIcon name="shield-check" className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Zero Bleed 2PC Protection</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Failed generations release reserved credits atomically. You only pay for successful outputs.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0">
                  <BrandIcon name="flux" className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Cross-Ecosystem Universal</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">One balance works across Image Studio, Video, Veo Cinema, Lip Sync, and Developer API Keys.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STUDIO MONTHLY PLANS ($3,000 - $10,000) */}
        {activeTab === 'monthly' && (
          <div className="mb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {MONTHLY_STUDIO_PLANS.map((plan) => (
                <Card
                  key={plan.name}
                  className={`p-6 flex flex-col justify-between transition-all ${
                    plan.popular
                      ? 'border-[#00e5ff] shadow-[0_0_30px_rgba(0,229,255,0.15)] bg-[#141820]'
                      : 'border-white/10'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-[#f5f7fa] text-base">{plan.name}</h3>
                      {plan.popular && (
                        <Badge variant="default" className="text-[10px]">
                          AGENCY CHOICE
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-3xl sm:text-4xl font-black font-mono text-[#f5f7fa]">{plan.price}</span>
                      <span className="text-xs text-zinc-400 font-semibold">{plan.period}</span>
                    </div>
                    <div className="text-xs font-bold text-[#00e5ff] font-mono mb-1">{plan.fastCredits}</div>
                    <div className="text-[11px] font-semibold text-emerald-400 mb-3">{plan.relaxed}</div>
                    <p className="text-xs text-zinc-400 mb-5">{plan.desc}</p>

                    <div className="space-y-2 border-t border-white/5 pt-4 mb-6">
                      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                        Plan Inclusions & Concurrency
                      </div>
                      <div className="text-xs text-[#00e5ff] font-mono font-semibold mb-2">
                        ⚡ {plan.concurrency}
                      </div>
                      {plan.features.map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-zinc-300">
                          <BrandIcon name="check" className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Link
                    href="/billing"
                    className={`block text-center py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      plan.popular
                        ? 'bg-[#00e5ff] hover:bg-[#38bdf8] text-[#09090b] shadow-glow'
                        : 'bg-white/10 hover:bg-white/15 text-white'
                    }`}
                  >
                    Activate {plan.name}
                  </Link>
                </Card>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs text-blue-300 leading-relaxed">
              <strong>Fair-Use Relaxed Unlimited Model:</strong> High-tier studio subscriptions include a massive Fast Priority allocation for instant synthesis. When Fast compute is exhausted, your team continues generating in Relaxed Mode without extra charge, protected by fair-use concurrency throttling.
            </div>
          </div>
        )}

        {/* TAB 3: FOUNDER BACKER PASS (1,000 - 10,000 EARLY SEED INVESTORS) */}
        {activeTab === 'backers' && (
          <div className="mb-12">
            <div className="p-8 rounded-3xl bg-gradient-to-br from-[#12141c] via-[#0d1017] to-[#12141c] border border-[#00e5ff]/30 shadow-[0_0_40px_rgba(0,229,255,0.08)] mb-8">
              <div className="max-w-3xl">
                <Badge variant="default" className="mb-3 text-[10px] tracking-widest uppercase">
                  Seed Community Backer Tier (1,000 – 10,000 Members)
                </Badge>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-3">
                  Sovereign Founder Pass: Co-Own the Future of AI Cinema
                </h2>
                <p className="text-sm text-zinc-300 leading-relaxed mb-6">
                  Early contributors who back Timecapsule Studio during our foundational stage receive perpetual software utility, monthly compounding compute allocations, and direct revenue sharing from the platform’s net margins.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {BACKER_BENEFITS.map((benefit, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-[#14141c]/90 border border-white/10 flex flex-col justify-between">
                    <div>
                      <div className="w-9 h-9 rounded-xl bg-[#00e5ff]/10 border border-[#00e5ff]/30 flex items-center justify-center text-[#00e5ff] mb-3">
                        <BrandIcon name="check" className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-sm text-white mb-2">{benefit.title}</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">{benefit.desc}</p>
                    </div>
                  </div>
                ))}

                {/* 6th Card: Financial Revenue Sharing Waterfall */}
                <div className="p-5 rounded-2xl bg-[#00e5ff]/10 border border-[#00e5ff]/40 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-[#00e5ff] font-bold uppercase tracking-wider block mb-1">
                      Platform Margin Waterfall
                    </span>
                    <h3 className="font-bold text-sm text-white mb-2">33% / 27% / 20% / 20% Model</h3>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Every $100 earned distributes $33 to vendor compute, $27 to core engineering, <strong>$20 to the Seed Backer Pool</strong>, and $20 to company treasury.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#00e5ff]/20 text-[11px] font-mono font-bold text-[#00e5ff]">
                    Direct Alignment with Studio Growth
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/billing"
                  className="px-6 py-3 rounded-xl bg-[#00e5ff] hover:bg-[#38bdf8] text-[#09090b] font-black text-xs uppercase tracking-wider transition-all shadow-glow"
                >
                  Join Founder Backer Waitlist
                </Link>
                <Link
                  href="/docs/white-label"
                  className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider transition-all"
                >
                  Read White-Label Architecture
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: MODEL RATE CARDS */}
        {activeTab === 'models' && (
          <div>
            {/* Filter and Search Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8">
              {/* Modality Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#121217] border border-white/10 rounded-lg">
                {[
                  { id: 'All', label: 'All Models' },
                  { id: 'Video', label: 'Video 307' },
                  { id: 'Image', label: 'Image 213' },
                  { id: 'Music', label: 'Music 25' },
                  { id: 'Tools', label: 'Tools 188' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveModality(tab.id)}
                    className={`px-3 py-1.5 rounded text-xs font-semibold transition-all cursor-pointer ${
                      activeModality === tab.id
                        ? 'bg-[#00e5ff] text-[#09090b] shadow-xs'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search Input */}
              <div className="relative w-full md:w-72">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </span>
                <Input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search models..."
                  className="pl-8"
                />
              </div>
            </div>

            {/* Grouped Comparison Tables */}
            <div className="space-y-8 mb-12">
              {MODEL_GROUPS.map((group) => {
                const visibleModels = group.models.filter(
                  (m) =>
                    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    m.modality.toLowerCase().includes(searchTerm.toLowerCase())
                );

                if (visibleModels.length === 0) return null;

                return (
                  <Card key={group.name} className="overflow-hidden">
                    {/* Group Title Header */}
                    <div className="px-6 py-3.5 bg-[#181820] border-b border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <BrandIcon name={group.name} className="w-4 h-4 text-[#00e5ff]" />
                        <h2 className="text-sm font-bold text-[#f5f7fa]">{group.name}</h2>
                      </div>
                      <Badge variant="secondary">
                        {group.count}
                      </Badge>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#14141a] text-zinc-400 uppercase font-semibold text-[10px] tracking-wider border-b border-white/5">
                          <tr>
                            <th className="px-6 py-3">MODEL & MODALITY</th>
                            <th className="px-6 py-3">TIMECAPSULE RATE</th>
                            <th className="px-6 py-3">FAL.AI RATE</th>
                            <th className="px-6 py-3">REPLICATE RATE</th>
                            <th className="px-6 py-3 text-right">SAVINGS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-zinc-300">
                          {visibleModels.map((row) => (
                            <tr key={row.name} className="hover:bg-white/[0.02] transition-colors">
                              <td className="px-6 py-3.5">
                                <Link href={`/${row.name}`} className="font-bold text-[#f5f7fa] hover:text-[#00e5ff] transition-colors block">
                                  {row.name}
                                </Link>
                                <span className="text-[10px] text-zinc-500 font-mono tracking-wider">
                                  {row.modality}
                                </span>
                              </td>
                              <td className="px-6 py-3.5 font-bold text-[#00e5ff] font-mono">
                                {row.timecapsule}
                              </td>
                              <td className="px-6 py-3.5 text-zinc-400 font-mono">
                                {row.fal}
                              </td>
                              <td className="px-6 py-3.5 text-zinc-400 font-mono">
                                {row.replicate}
                              </td>
                              <td className="px-6 py-3.5 text-right">
                                {row.discount ? (
                                  <Badge variant="success">
                                    {row.discount}
                                  </Badge>
                                ) : (
                                  <span className="text-zinc-600">-</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Note */}
        <div className="flex items-center justify-between pb-8 text-xs text-zinc-500 border-t border-white/5 pt-4">
          <span>Rates updated daily via provider API telemetry. All tasks backed by durable credit refund protection.</span>
          <span className="font-mono text-[11px] text-zinc-400">Timecapsule Studio Tokenomics v1</span>
        </div>
      </main>

      <PlatformFooter />
    </div>
  );
}
