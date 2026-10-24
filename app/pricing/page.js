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
    credits: '2,500 Credits',
    bonus: 'Small Initial Offering ($1 = 250 cr)',
    desc: 'Pay-as-you-go multimodal compute credits. Zero expiration.',
    capacity: 'On-demand image, video, and lip-sync generations',
    popular: false,
    offering_type: 'self_serve',
  },
  {
    name: 'Creator Pack',
    price: '$25',
    credits: '6,800 Credits',
    bonus: '+8.8% Bonus Credits ($0.00368/cr)',
    desc: 'Volume top-up for active creators and storyboarders.',
    capacity: 'High-frequency image iterations and video renders',
    popular: true,
    offering_type: 'self_serve',
  },
  {
    name: 'Studio Pro',
    price: '$75',
    credits: '22,500 Credits',
    bonus: '+20% Bonus Credits ($0.00333/cr)',
    desc: 'Professional studio batch generation and multi-scene pipelines.',
    capacity: 'Commercial creative workflows and HD video pipelines',
    popular: false,
    offering_type: 'self_serve',
  },
  {
    name: 'Production House',
    price: '$250',
    credits: '85,000 Credits',
    bonus: 'Enterprise Quotation Only',
    desc: 'Quotation-only tier for high-throughput studio production pipelines.',
    capacity: 'Contact studio team for volume engagement and terms',
    popular: false,
    offering_type: 'quotation_only',
  },
  {
    name: 'Enterprise Fleet',
    price: '$1,000',
    credits: '380,000 Credits',
    bonus: 'Enterprise Quotation Only',
    desc: 'Quotation-only tier for API integrations, game studios, and resellers.',
    capacity: 'Contact studio team for custom SLA and compute allocations',
    popular: false,
    offering_type: 'quotation_only',
  },
];

export const MONTHLY_STUDIO_PLANS = [
  {
    name: 'Studio Scale',
    price: '$3,000',
    period: '/month (Quotation Only)',
    fastCredits: 'Custom Scoped Allowance',
    relaxed: 'Queued Generations (Fair-Use)',
    concurrency: '10 Concurrent Tasks',
    desc: 'Dedicated enterprise concurrency for creative teams. Unlisted self-serve; available via custom quotation.',
    features: [
      'High-priority fast compute queue',
      'Relaxed image generation lanes',
      '10 Concurrent worker pipelines',
      'Filmmaking Suite multi-seat license included',
      'Dedicated technical support channel',
    ],
    popular: false,
  },
  {
    name: 'Agency Master',
    price: '$5,000',
    period: '/month (Quotation Only)',
    fastCredits: 'Custom Scoped Allowance',
    relaxed: 'Multi-seat Queued Lanes',
    concurrency: '20 Concurrent Tasks',
    desc: 'Multi-seat production pipelines for creative agencies. Available via custom quotation.',
    features: [
      'High-priority agency queue',
      'Relaxed image + video lanes',
      '20 Concurrent worker pipelines',
      'Unlimited team member seats',
      'Shared Studio Media Vault & Asset CDN',
      'Direct Private Slack / Telegram channel',
    ],
    popular: true,
  },
  {
    name: 'Sovereign VIP',
    price: '$10,000',
    period: '/month (Quotation Only)',
    fastCredits: 'Custom Scoped Allowance',
    relaxed: 'VIP Dedicated GPU Queue',
    concurrency: '50 Concurrent Tasks',
    desc: 'Dedicated compute lanes and custom SLA for media enterprises. Available via custom quotation.',
    features: [
      'VIP Dedicated GPU Priority Queue Lane',
      '50 Concurrent worker pipelines',
      'Custom White-Label domain instance included',
      'Custom model fine-tuning & LoRA hosting support',
      'Enterprise SLA agreement',
    ],
    popular: false,
  },
];

const MODEL_GROUPS = [
  {
    name: 'Flagship Studio Models',
    count: '6 verified models',
    models: [
      { name: 'nano-banana-pro (1K)', modality: 'TEXT TO IMAGE', timecapsule: '129 cr (Approved Test Scenario)', primaryProvider: 'Muapi ($0.120 published list price)', fallbackRoute: 'Kie (Same Model) / Cross-model opt-in required', status: 'Test Scenario (129 cr min)' },
      { name: 'nano-banana-pro (2K)', modality: 'TEXT TO IMAGE', timecapsule: '140 cr (129 min + 11 commercial markup)', primaryProvider: 'Muapi ($0.120 published list price)', fallbackRoute: 'Kie (Same Model) / Cross-model opt-in required', status: 'Test Scenario (140 cr)' },
      { name: 'nano-banana-pro (4K)', modality: 'TEXT TO IMAGE', timecapsule: '160 cr (129 min + 31 commercial markup)', primaryProvider: 'Muapi ($0.120 published list price)', fallbackRoute: 'Kie (Same Model) / Cross-model opt-in required', status: 'Test Scenario (160 cr)' },
      { name: 'nano-banana-pro-edit', modality: 'IMAGE TO IMAGE', timecapsule: '129 cr (Approved Test Scenario)', primaryProvider: 'Muapi ($0.120 published list price)', fallbackRoute: 'Kie (Same Model)', status: 'Test Scenario (129 cr min)' },
      { name: 'seedance-pro-t2v (720p)', modality: 'TEXT TO VIDEO', timecapsule: '350 cr ($1.40)', primaryProvider: 'Muapi ($0.180 published list price)', fallbackRoute: 'Kie Seedance 1.5 ($0.250 list price)', status: 'Verified (720p List Price)' },
      { name: 'seedance-pro-t2v (1080p)', modality: 'TEXT TO VIDEO', timecapsule: '450 cr ($1.80)', primaryProvider: 'Muapi ($0.180+ 1080p unverified)', fallbackRoute: 'Kie Seedance 1.5 ($0.250 list price)', status: 'Provisional (1080p Surcharge Unverified)' },
      { name: 'veo3.1-fast-text-to-video', modality: 'TEXT TO VIDEO', timecapsule: '450 cr ($1.80)', primaryProvider: 'Kie ($0.300–$0.400 range; $0.400 bound applied)', fallbackRoute: 'None (Direct route)', status: 'Provisional (Bound: $0.400)' },
      { name: 'lipsync-studio-v1', modality: 'LIP SYNC', timecapsule: '30 cr ($0.120)', primaryProvider: 'Muapi (~$0.02–$0.04)', fallbackRoute: 'Third-party sync', status: 'Provisional' },
    ],
  },
  {
    name: 'Tools & Utilities',
    count: '20 models',
    models: [
      { name: 'ai-image-upscaler', modality: 'IMAGE TO IMAGE', timecapsule: '10 cr ($0.040)', primaryProvider: 'Muapi / Fal (~$0.015)', fallbackRoute: 'Replicate', status: 'Profitable' },
      { name: 'ai-image-face-swap', modality: 'IMAGE TO IMAGE', timecapsule: '15 cr ($0.060)', primaryProvider: 'Muapi / Fal (~$0.020)', fallbackRoute: 'Replicate', status: 'Profitable' },
      { name: 'ai-product-shot', modality: 'IMAGE TO IMAGE', timecapsule: '20 cr ($0.080)', primaryProvider: 'Muapi (~$0.030)', fallbackRoute: 'Fal', status: 'Profitable' },
      { name: 'ai-skin-enhancer', modality: 'IMAGE TO IMAGE', timecapsule: '10 cr ($0.040)', primaryProvider: 'Muapi (~$0.015)', fallbackRoute: 'Fal', status: 'Profitable' },
      { name: 'ai-background-remover', modality: 'IMAGE TO IMAGE', timecapsule: '5 cr ($0.020)', primaryProvider: 'Muapi (~$0.008)', fallbackRoute: 'Fal', status: 'Profitable' },
    ],
  },
  {
    name: 'Black Forest Labs Flux',
    count: '11 models',
    models: [
      { name: 'flux-dev', modality: 'TEXT TO IMAGE', timecapsule: '15 cr ($0.060)', primaryProvider: 'Fal ($0.025 verified)', fallbackRoute: 'Replicate ($0.025)', status: 'Profitable (~54%)' },
      { name: 'flux-schnell', modality: 'TEXT TO IMAGE', timecapsule: '10 cr ($0.040)', primaryProvider: 'Replicate ($0.003 verified)', fallbackRoute: 'Muapi ($0.003)', status: 'Profitable (~90%)' },
      { name: 'flux-3-klein-text-to-image', modality: 'TEXT TO IMAGE', timecapsule: '12 cr ($0.048)', primaryProvider: 'Fal (~$0.015)', fallbackRoute: 'Replicate', status: 'Profitable' },
      { name: 'flux-3-klein-edit-image', modality: 'IMAGE TO IMAGE', timecapsule: '15 cr ($0.060)', primaryProvider: 'Fal (~$0.015)', fallbackRoute: 'Replicate', status: 'Profitable' },
    ],
  },
  {
    name: 'ByteDance Seedance 2.5',
    count: '18 models',
    models: [
      { name: 'seedance-2.5-text-to-video', modality: 'TEXT TO VIDEO', timecapsule: '350 cr ($1.40)', primaryProvider: 'Muapi ($0.180 verified)', fallbackRoute: 'Kie', status: 'Profitable' },
      { name: 'seedance-2.5-image-to-video', modality: 'IMAGE TO VIDEO', timecapsule: '350 cr ($1.40)', primaryProvider: 'Muapi ($0.180 verified)', fallbackRoute: 'Kie', status: 'Profitable' },
      { name: 'seedance-2.5-first-last-frame', modality: 'IMAGE TO VIDEO', timecapsule: '450 cr ($1.80)', primaryProvider: 'Muapi (~$0.250)', fallbackRoute: 'Kie', status: 'Profitable' },
    ],
  },
  {
    name: 'Audio & Music Synthesis',
    count: '4 models',
    models: [
      { name: 'mmaudio-v2-text-to-audio', modality: 'TEXT TO AUDIO', timecapsule: '10 cr ($0.040)', primaryProvider: 'Muapi (~$0.015)', fallbackRoute: 'Fal', status: 'Profitable' },
      { name: 'lyria-3-music', modality: 'TEXT TO AUDIO', timecapsule: '25 cr ($0.100)', primaryProvider: 'Muapi (~$0.035)', fallbackRoute: 'Fal', status: 'Profitable' },
    ],
  },
];

export default function PricingPage() {
  const [activeTab, setActiveTab] = useState('packs'); // 'packs' | 'monthly' | 'models'
  const [activeModality, setActiveModality] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="min-h-screen bg-[var(--tc-bg-page)] text-[var(--tc-text-primary)] flex flex-col font-sans">
      <PlatformNav activeModule="pricing" />

      <main className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col">
        {/* Notice Banner */}
        <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px]">Notice</span>
            <span>Single-Tenant Private Preview — Live commercial billing is paused pending verified rate card review. Rates below reflect the provisional studio price book.</span>
          </div>
          <span className="font-mono text-[11px] text-amber-400">1 Credit = $0.004 USD (Base Denomination)</span>
        </div>

        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#00e5ff]">
                  Rate Cards & Compute Allocations
                </span>
                <span className="text-zinc-600">•</span>
                <span className="text-[11px] text-zinc-400 font-mono">Proposed Denomination: 250 Credits = $1.00 USD</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#f5f7fa]">
                Plans, Compute Packs & Economics
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                Transparent model pricing and credit pack tiers. Multi-provider cascade failover across verified provider routes.
              </p>
            </div>

            {/* Main Category Switcher */}
            <div className="flex items-center gap-1.5 p-1 bg-[#121217] border border-white/10 rounded-xl self-start sm:self-auto">
              {[
                { id: 'packs', label: 'Credit Top-Ups ($10–$1,000)' },
                { id: 'monthly', label: 'Studio Monthly Plans' },
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

        {/* TAB 3: MODEL RATE CARDS */}
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
                            <th className="px-6 py-3">TIMECAPSULE RATE (PROVISIONAL)</th>
                            <th className="px-6 py-3">PRIMARY PROVIDER COGS</th>
                            <th className="px-6 py-3">FALLBACK ROUTE</th>
                            <th className="px-6 py-3 text-right">STATUS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-zinc-300">
                          {visibleModels.map((row) => (
                            <tr key={row.name} className="hover:bg-white/[0.02] transition-colors">
                              <td className="px-6 py-3.5">
                                <Link href={`/${row.name.split(' ')[0]}`} className="font-bold text-[#f5f7fa] hover:text-[#00e5ff] transition-colors block">
                                  {row.name}
                                </Link>
                                <span className="text-[10px] text-zinc-500 font-mono tracking-wider">
                                  {row.modality}
                                </span>
                              </td>
                              <td className="px-6 py-3.5 font-bold text-[#00e5ff] font-mono">
                                {row.timecapsule}
                              </td>
                              <td className="px-6 py-3.5 text-zinc-300 font-mono">
                                {row.primaryProvider || '-'}
                              </td>
                              <td className="px-6 py-3.5 text-zinc-400 font-mono">
                                {row.fallbackRoute || '-'}
                              </td>
                              <td className="px-6 py-3.5 text-right font-mono text-[11px]">
                                {row.status ? (
                                  <Badge variant={row.status.includes('Profitable') ? 'success' : 'secondary'}>
                                    {row.status}
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
